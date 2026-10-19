-- Essays (docs/specs/17-essays.md): the UC personal insight questions, each student's drafts, and AI feedback on them.
-- The questions are academic records like deadlines: provenance on every row, written only by the import scripts
-- (service role), and readable only once a person has verified them. Drafts belong to the student alone. Feedback
-- is written only by the essay-feedback function (service role) and read by its owner.

create table piq_prompts (
  id uuid primary key default gen_random_uuid(),
  -- major, leadership, creativity, ... Same key in every cycle, so a draft can follow its question
  key text not null check (key ~ '^[a-z0-9-]+$'),
  cycle text not null check (cycle ~ '^(fall|winter|spring|summer)-\d{4}$'),
  -- In Stackd's own words; the app links to UC's page for the exact wording
  short_name text not null check (length(trim(short_name)) > 0),
  summary text not null check (length(trim(summary)) > 0),
  required boolean not null default false,
  sort smallint not null check (sort > 0),
  source_name text not null,
  source_url text not null check (source_url ~ '^https://'),
  retrieved_at timestamptz not null,
  verified_at timestamptz,
  verification_status verification_status not null default 'unverified',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (key, cycle),
  unique (cycle, sort),
  check (verification_status <> 'verified' or verified_at is not null)
);

-- One required question per cycle
create unique index piq_prompts_one_required on piq_prompts (cycle) where required;

create trigger set_updated_at before update on piq_prompts for each row execute function set_updated_at();
create trigger protect_verified before update or delete on piq_prompts for each row execute function protect_verified();
alter table piq_prompts enable row level security;
revoke all on piq_prompts from anon;
revoke insert, update, delete on piq_prompts from authenticated;

create policy "Verified rows can be read" on piq_prompts for select to authenticated
  using (verification_status = 'verified');

-- A student's answer to one question in one cycle. chosen: one of the 3 optional questions they picked.
-- done_at: the student says it's final; it doesn't lock the text.
create table essay_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  prompt_key text not null,
  cycle text not null,
  body text not null default '' check (length(body) <= 20000),
  word_count integer not null default 0 check (word_count >= 0),
  chosen boolean not null default false,
  done_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, prompt_key, cycle),
  -- Feedback names a draft together with its owner, so it can't point at someone else's draft
  unique (id, user_id),
  foreign key (prompt_key, cycle) references piq_prompts (key, cycle) on update restrict on delete restrict
);

create trigger set_updated_at before update on essay_drafts for each row execute function set_updated_at();

-- Owner-only, like the other per-student tables
alter table essay_drafts enable row level security;
revoke all on essay_drafts from anon;
create policy "Owner can read" on essay_drafts for select to authenticated using ((select auth.uid()) = user_id);
create policy "Owner can add" on essay_drafts for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Owner can change" on essay_drafts for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Owner can remove" on essay_drafts for delete to authenticated using ((select auth.uid()) = user_id);

-- One feedback request and its result. Rows also count the daily limits (3 per question, 8 per account).
create table essay_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  draft_id uuid not null,
  created_at timestamptz not null default now(),
  model text not null,
  input_words integer not null check (input_words >= 0),
  result jsonb not null,
  helpful boolean,
  foreign key (draft_id, user_id) references essay_drafts (id, user_id) on delete cascade
);

create index on essay_feedback (user_id, created_at);
create index on essay_feedback (draft_id, created_at);

-- The student reads their own; only the function (service role) writes
alter table essay_feedback enable row level security;
revoke all on essay_feedback from anon;
revoke insert, update, delete on essay_feedback from authenticated;
create policy "Owner can read" on essay_feedback for select to authenticated using ((select auth.uid()) = user_id);

-- When the student agreed to send drafts for AI feedback (17 → First time only). Null until they do.
alter table profiles add column ai_feedback_consent_at timestamptz;

-- Deleting an account removes the student's drafts and feedback by name, before the account itself. The foreign keys
-- cascade too; this keeps it true if they ever change.
create or replace function delete_my_account() returns void language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
begin
  if v_user is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;
  delete from public.essay_feedback where user_id = v_user;
  delete from public.essay_drafts where user_id = v_user;
  delete from auth.users where id = v_user;
end $$;

revoke all on function delete_my_account() from public, anon;
grant execute on function delete_my_account() to authenticated;

-- The import pipeline's side (scripts/import/essays.mjs): same rules as deadlines. One transaction, all or nothing;
-- unchanged rows are left alone; a file that would change a verified row stops the whole run; imported rows start
-- unverified.
create function apply_essays_batch(payload jsonb) returns jsonb language plpgsql set search_path = public as $$
declare
  r jsonb;
  existing record;
  outcome text;
  counts jsonb := '{"piq_prompts":{"inserted":0,"updated":0,"unchanged":0}}';
begin
  for r in select * from jsonb_array_elements(coalesce(payload -> 'piq_prompts', '[]')) loop
    select * into existing from piq_prompts where key = r ->> 'key' and cycle = r ->> 'cycle';
    if not found then
      insert into piq_prompts (key, cycle, short_name, summary, required, sort, source_name, source_url, retrieved_at)
      values (r ->> 'key', r ->> 'cycle', r ->> 'short_name', r ->> 'summary', (r ->> 'required')::boolean, (r ->> 'sort')::smallint,
              r ->> 'source_name', r ->> 'source_url', (r ->> 'retrieved_at')::timestamptz);
      outcome := 'inserted';
    elsif (existing.short_name, existing.summary, existing.required, existing.sort, existing.source_name, existing.source_url)
          is not distinct from
          (r ->> 'short_name', r ->> 'summary', (r ->> 'required')::boolean, (r ->> 'sort')::smallint, r ->> 'source_name', r ->> 'source_url') then
      outcome := 'unchanged';
    elsif existing.verification_status = 'verified' then
      raise exception 'personal insight question % (%) is verified and the file would change it; nothing was applied', existing.key, existing.cycle;
    else
      update piq_prompts set short_name = r ->> 'short_name', summary = r ->> 'summary', required = (r ->> 'required')::boolean,
        sort = (r ->> 'sort')::smallint, source_name = r ->> 'source_name', source_url = r ->> 'source_url',
        retrieved_at = (r ->> 'retrieved_at')::timestamptz
      where id = existing.id;
      outcome := 'updated';
    end if;
    counts := jsonb_set(counts, array['piq_prompts', outcome], to_jsonb((counts #>> array['piq_prompts', outcome])::int + 1));
  end loop;
  return counts;
end $$;

-- The entry point the import script calls. A dry run does all the work, then rolls it back and only logs the run.
create function import_essays_batch(payload jsonb, source_file text, dry_run boolean) returns jsonb
language plpgsql security definer set search_path = public as $$
declare counts jsonb;
begin
  begin
    counts := apply_essays_batch(payload);
    if dry_run then
      raise exception 'stackd_dry_run';
    end if;
  exception when raise_exception then
    if sqlerrm <> 'stackd_dry_run' then
      raise;
    end if;
    insert into import_runs (source_file, dry_run, status, counts) values (source_file, true, 'dry_run', counts);
    return jsonb_build_object('status', 'dry_run', 'counts', counts);
  end;
  insert into import_runs (source_file, dry_run, status, counts) values (source_file, false, 'applied', counts);
  return jsonb_build_object('status', 'applied', 'counts', counts);
end $$;

-- The verify step now also takes piq_prompts. Same checks as before.
create or replace function verify_planning_rows(rows jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  r jsonb;
  n int := 0;
  hit int;
begin
  for r in select * from jsonb_array_elements(rows) loop
    if r ->> 'table' not in ('institutions', 'majors', 'agreement_links', 'deadlines', 'checklists', 'checklist_steps', 'piq_prompts') then
      raise exception 'unknown table %', r ->> 'table';
    end if;
    execute format(
      'update %I set verification_status = ''verified'', verified_at = $1
       where id = $2 and verification_status <> ''verified'' and source_url = $4
         and date_trunc(''milliseconds'', updated_at) = date_trunc(''milliseconds'', $3::timestamptz)',
      r ->> 'table')
      using (r ->> 'checked_at')::timestamptz, (r ->> 'id')::uuid, r ->> 'updated_at', r ->> 'source_url';
    get diagnostics hit = row_count;
    if hit = 0 then
      raise exception '% row % changed since the review report, or is already verified; nothing was verified', r ->> 'table', r ->> 'id';
    end if;
    n := n + 1;
  end loop;
  return jsonb_build_object('verified', n);
end $$;

-- Reopening a verified row now also covers personal insight questions
create or replace function reopen_verified_row(p_id uuid, p_by text, p_reason text, p_dry_run boolean) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_table text;
  v_record text;
  v_status verification_status;
  v_verified_at timestamptz;
begin
  if coalesce(trim(p_by), '') = '' or coalesce(trim(p_reason), '') = '' then
    raise exception 'say who is reopening the row and why';
  end if;

  select 'deadlines', d.slug, d.verification_status, d.verified_at into v_table, v_record, v_status, v_verified_at
    from deadlines d where d.id = p_id;
  if not found then
    select 'checklists', c.slug, c.verification_status, c.verified_at into v_table, v_record, v_status, v_verified_at
      from checklists c where c.id = p_id;
  end if;
  if not found then
    select 'checklist_steps', c.slug || ' step ' || s.position || ': ' || s.title, s.verification_status, s.verified_at
      into v_table, v_record, v_status, v_verified_at
      from checklist_steps s join checklists c on c.id = s.checklist_id where s.id = p_id;
  end if;
  if not found then
    select 'piq_prompts', q.cycle || ' ' || q.key || ': ' || q.short_name, q.verification_status, q.verified_at
      into v_table, v_record, v_status, v_verified_at
      from piq_prompts q where q.id = p_id;
  end if;
  if not found then
    raise exception 'no deadline, checklist, checklist step or personal insight question has id %', p_id;
  end if;
  if v_status <> 'verified' then
    raise exception '% row % (%) isn''t verified, so it can be fixed in the file and imported as it is', v_table, p_id, v_record;
  end if;

  if p_dry_run then
    return jsonb_build_object('status', 'dry_run', 'table', v_table, 'id', p_id, 'record', v_record, 'verified_at', v_verified_at);
  end if;

  -- On for this one update only, then off again
  perform set_config('stackd.allow_verified_change', 'on', true);
  execute format('update %I set verification_status = ''unverified'', verified_at = null where id = $1', v_table) using p_id;
  perform set_config('stackd.allow_verified_change', 'off', true);

  insert into reopen_log (table_name, row_id, record, reopened_by, reason, was_verified_at)
  values (v_table, p_id, v_record, trim(p_by), trim(p_reason), v_verified_at);
  return jsonb_build_object('status', 'reopened', 'table', v_table, 'id', p_id, 'record', v_record, 'verified_at', v_verified_at);
end $$;

revoke all on function apply_essays_batch(jsonb) from public, anon, authenticated;
revoke all on function import_essays_batch(jsonb, text, boolean) from public, anon, authenticated;
grant execute on function import_essays_batch(jsonb, text, boolean) to service_role;
revoke all on function reopen_verified_row(uuid, text, text, boolean) from public, anon, authenticated;
grant execute on function reopen_verified_row(uuid, text, text, boolean) to service_role;
