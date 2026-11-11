-- Plan (docs/specs/24-plan.md → Data): each student's term-by-term plan and its settings, plus the academic data the
-- builder uses: the usual order of course types, the Cal-GETC areas, and each college's own courses. The academic tables
-- work like opportunities: provenance on every row, written only by the import (service role), protect_verified, and
-- readable only once a person has verified them.

-- The usual order of course types, from college catalogs' prerequisites. before_topic is the prerequisite:
-- { topic: cs2, before_topic: cs1 } means take cs1 first.
create table topic_order (
  id uuid primary key default gen_random_uuid(),
  topic text not null check (topic ~ '^[a-z0-9-]+$'),
  before_topic text not null check (before_topic ~ '^[a-z0-9-]+$'),
  source_name text not null,
  source_url text not null check (source_url ~ '^https://'),
  academic_year text not null check (academic_year ~ '^\d{4}-\d{2}$'),
  retrieved_at timestamptz not null,
  verified_at timestamptz,
  verification_status verification_status not null default 'unverified',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (topic, before_topic),
  check (topic <> before_topic),
  check (verification_status <> 'verified' or verified_at is not null)
);

-- A general education pattern's areas (cal-getc 1A …), from the official standards
create table ge_areas (
  id uuid primary key default gen_random_uuid(),
  pattern text not null check (pattern ~ '^[a-z0-9-]+$'),
  code text not null check (code ~ '^\d[A-Z]?$'),
  name text not null check (length(trim(name)) > 0),
  -- 0 courses for an area met inside another area's course, like a lab (5C) in a 5A or 5B course
  courses smallint not null check (courses >= 0),
  units numeric(3, 1) not null constraint ge_areas_units_check check (units > 0 or (units = 0 and courses = 0)),
  sort smallint not null check (sort > 0),
  source_name text not null,
  source_url text not null check (source_url ~ '^https://'),
  academic_year text not null check (academic_year ~ '^\d{4}-\d{2}$'),
  retrieved_at timestamptz not null,
  verified_at timestamptz,
  verification_status verification_status not null default 'unverified',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pattern, code),
  -- Deferred so a file can reorder rows in one import
  unique (pattern, sort) deferrable initially deferred,
  check (verification_status <> 'verified' or verified_at is not null)
);

-- A community college's own course, from its catalog. It shows for a requirement only through topics, which a person
-- sets and checks.
create table college_courses (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions on delete restrict,
  -- CS 1, MATH 1A, ENGL C1000
  code text not null check (code ~ '^[A-Z]{1,6} [A-Z]?\d{1,4}[A-Z]{0,2}$'),
  title text not null check (length(trim(title)) > 0),
  units numeric(3, 1) not null check (units > 0),
  -- Only when the catalog prints one
  c_id text check (c_id ~ '^[A-Z]{2,5} \d{3}[A-Z]?$'),
  topics text[] not null check (cardinality(topics) > 0 and all_match(topics, '^[a-z0-9-]+$')),
  source_name text not null,
  source_url text not null check (source_url ~ '^https://'),
  academic_year text not null check (academic_year ~ '^\d{4}-\d{2}$'),
  retrieved_at timestamptz not null,
  verified_at timestamptz,
  verification_status verification_status not null default 'unverified',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, code, academic_year),
  check (verification_status <> 'verified' or verified_at is not null)
);

create index on college_courses (institution_id);

-- College courses belong to community colleges
create function college_course_at_college() returns trigger language plpgsql set search_path = public as $$
begin
  if not exists (select 1 from institutions where id = new.institution_id and institution_type = 'community_college') then
    raise exception 'a college course must be at a community college' using errcode = 'check_violation';
  end if;
  return new;
end $$;

create trigger college_course_at_college before insert or update on college_courses for each row execute function college_course_at_college();

do $$
declare t text;
begin
  foreach t in array array['topic_order', 'ge_areas', 'college_courses'] loop
    execute format('create trigger set_updated_at before update on %I for each row execute function set_updated_at()', t);
    execute format('create trigger protect_verified before update or delete on %I for each row execute function protect_verified()', t);
    execute format('alter table %I enable row level security', t);
    execute format('revoke insert, update, delete on %I from anon, authenticated', t);
    execute format('create policy "Verified rows can be read" on %I for select to anon, authenticated using (verification_status = ''verified'')', t);
  end loop;
end $$;

-- The student's plan settings (24 → 6)
create table plan_settings (
  user_id uuid primary key references auth.users on delete cascade,
  units_per_term int not null default 15 check (units_per_term between 3 and 21),
  include_summer boolean not null default false,
  -- Transferable units the student says they've finished; null counts the courses marked done
  units_done numeric(4, 1) check (units_done >= 0),
  updated_at timestamptz not null default now()
);

create type plan_item_kind as enum ('major', 'ge', 'custom');
create type plan_placed_by as enum ('builder', 'student');

-- One card in the student's plan. A major item's status lives in user_topic_status, so Plan and Explore can't disagree.
create table plan_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  kind plan_item_kind not null,
  topic text check (topic ~ '^[a-z0-9-]+$'),
  ge_area text check (ge_area ~ '^\d[A-Z]?$'),
  -- null is Not in a term yet
  term text check (term ~ '^(fall|spring|summer)-\d{4}$'),
  position int not null default 0 check (position >= 0),
  placed_by plan_placed_by not null default 'builder',
  college_course_id uuid references college_courses on delete set null,
  course_code text check (length(trim(course_code)) > 0),
  course_name text check (length(trim(course_name)) > 0),
  units numeric(3, 1) check (units > 0),
  status progress_status,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- topic is set only on major items and ge_area only on ge items, so these hold per kind
  unique (user_id, topic),
  unique (user_id, ge_area),
  check ((kind = 'major') = (topic is not null)),
  check ((kind = 'ge') = (ge_area is not null)),
  check (kind <> 'custom' or (course_name is not null and units is not null and placed_by = 'student')),
  check ((kind = 'major') = (status is null))
);

create index on plan_items (user_id, term);

do $$
declare t text;
begin
  foreach t in array array['plan_settings', 'plan_items'] loop
    execute format('create trigger set_updated_at before update on %I for each row execute function set_updated_at()', t);
    -- Owner-only, like the other per-student tables
    execute format('alter table %I enable row level security', t);
    execute format('revoke all on %I from anon', t);
    execute format('create policy "Owner can read" on %I for select to authenticated using ((select auth.uid()) = user_id)', t);
    execute format('create policy "Owner can add" on %I for insert to authenticated with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "Owner can change" on %I for update to authenticated
      using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "Owner can remove" on %I for delete to authenticated using ((select auth.uid()) = user_id)', t);
  end loop;
end $$;

-- Deleting an account also removes the student's plan by name. The foreign keys cascade too.
create or replace function delete_my_account() returns void language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
begin
  if v_user is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;
  delete from public.plan_items where user_id = v_user;
  delete from public.plan_settings where user_id = v_user;
  delete from public.user_topic_status where user_id = v_user;
  delete from public.review_comments where link_id in (select id from public.review_links where user_id = v_user);
  delete from public.review_links where user_id = v_user;
  delete from public.essay_feedback where user_id = v_user;
  delete from public.essay_drafts where user_id = v_user;
  delete from auth.users where id = v_user;
end $$;

revoke all on function delete_my_account() from public, anon;
grant execute on function delete_my_account() to authenticated;

-- The plan data import (scripts/import/plan-data.mjs): topic order, GE areas and college courses, same rules as the
-- others. One transaction, all or nothing; unchanged rows are left alone; a file that would change a verified row stops
-- the whole run; imported rows start unverified.
create function apply_plan_data_batch(payload jsonb) returns jsonb language plpgsql set search_path = public as $$
declare
  r jsonb;
  existing record;
  v_inst uuid;
  outcome text;
  counts jsonb := '{"topic_order":{"inserted":0,"updated":0,"unchanged":0},"ge_areas":{"inserted":0,"updated":0,"unchanged":0},"college_courses":{"inserted":0,"updated":0,"unchanged":0}}';
begin
  for r in select * from jsonb_array_elements(coalesce(payload -> 'topic_order', '[]')) loop
    select * into existing from topic_order where topic = r ->> 'topic' and before_topic = r ->> 'before_topic';
    if not found then
      insert into topic_order (topic, before_topic, source_name, source_url, academic_year, retrieved_at)
      values (r ->> 'topic', r ->> 'before_topic', r ->> 'source_name', r ->> 'source_url', r ->> 'academic_year', (r ->> 'retrieved_at')::timestamptz);
      outcome := 'inserted';
    elsif (existing.source_name, existing.source_url, existing.academic_year)
          is not distinct from (r ->> 'source_name', r ->> 'source_url', r ->> 'academic_year') then
      outcome := 'unchanged';
    elsif existing.verification_status = 'verified' then
      raise exception 'topic order % after % is verified and the file would change it; nothing was applied', existing.topic, existing.before_topic;
    else
      update topic_order set source_name = r ->> 'source_name', source_url = r ->> 'source_url', academic_year = r ->> 'academic_year',
        retrieved_at = (r ->> 'retrieved_at')::timestamptz
      where id = existing.id;
      outcome := 'updated';
    end if;
    counts := jsonb_set(counts, array['topic_order', outcome], to_jsonb((counts #>> array['topic_order', outcome])::int + 1));
  end loop;

  for r in select * from jsonb_array_elements(coalesce(payload -> 'ge_areas', '[]')) loop
    select * into existing from ge_areas where pattern = r ->> 'pattern' and code = r ->> 'code';
    if not found then
      insert into ge_areas (pattern, code, name, courses, units, sort, source_name, source_url, academic_year, retrieved_at)
      values (r ->> 'pattern', r ->> 'code', r ->> 'name', (r ->> 'courses')::smallint, (r ->> 'units')::numeric, (r ->> 'sort')::smallint,
              r ->> 'source_name', r ->> 'source_url', r ->> 'academic_year', (r ->> 'retrieved_at')::timestamptz);
      outcome := 'inserted';
    elsif (existing.name, existing.courses, existing.units, existing.sort, existing.source_name, existing.source_url, existing.academic_year)
          is not distinct from
          (r ->> 'name', (r ->> 'courses')::smallint, (r ->> 'units')::numeric, (r ->> 'sort')::smallint, r ->> 'source_name', r ->> 'source_url',
           r ->> 'academic_year') then
      outcome := 'unchanged';
    elsif existing.verification_status = 'verified' then
      raise exception 'GE area % % is verified and the file would change it; nothing was applied', existing.pattern, existing.code;
    else
      update ge_areas set name = r ->> 'name', courses = (r ->> 'courses')::smallint, units = (r ->> 'units')::numeric, sort = (r ->> 'sort')::smallint,
        source_name = r ->> 'source_name', source_url = r ->> 'source_url', academic_year = r ->> 'academic_year',
        retrieved_at = (r ->> 'retrieved_at')::timestamptz
      where id = existing.id;
      outcome := 'updated';
    end if;
    counts := jsonb_set(counts, array['ge_areas', outcome], to_jsonb((counts #>> array['ge_areas', outcome])::int + 1));
  end loop;

  for r in select * from jsonb_array_elements(coalesce(payload -> 'college_courses', '[]')) loop
    select id into v_inst from institutions where slug = r ->> 'institution';
    if v_inst is null then
      raise exception 'college course % names institution %, which isn''t in the database', r ->> 'code', r ->> 'institution';
    end if;
    select * into existing from college_courses where institution_id = v_inst and code = r ->> 'code' and academic_year = r ->> 'academic_year';
    if not found then
      insert into college_courses (institution_id, code, title, units, c_id, topics, source_name, source_url, academic_year, retrieved_at)
      values (v_inst, r ->> 'code', r ->> 'title', (r ->> 'units')::numeric, r ->> 'c_id', jsonb_text_array(r -> 'topics'),
              r ->> 'source_name', r ->> 'source_url', r ->> 'academic_year', (r ->> 'retrieved_at')::timestamptz);
      outcome := 'inserted';
    elsif (existing.title, existing.units, existing.c_id, existing.topics, existing.source_name, existing.source_url)
          is not distinct from
          (r ->> 'title', (r ->> 'units')::numeric, r ->> 'c_id', jsonb_text_array(r -> 'topics'), r ->> 'source_name', r ->> 'source_url') then
      outcome := 'unchanged';
    elsif existing.verification_status = 'verified' then
      raise exception 'college course % % (%) is verified and the file would change it; nothing was applied', r ->> 'institution', existing.code, existing.academic_year;
    else
      update college_courses set title = r ->> 'title', units = (r ->> 'units')::numeric, c_id = r ->> 'c_id', topics = jsonb_text_array(r -> 'topics'),
        source_name = r ->> 'source_name', source_url = r ->> 'source_url', retrieved_at = (r ->> 'retrieved_at')::timestamptz
      where id = existing.id;
      outcome := 'updated';
    end if;
    counts := jsonb_set(counts, array['college_courses', outcome], to_jsonb((counts #>> array['college_courses', outcome])::int + 1));
  end loop;

  return counts;
end $$;

-- The entry point the import script calls. A dry run does all the work, then rolls it back and only logs the run.
create function import_plan_data_batch(payload jsonb, source_file text, dry_run boolean) returns jsonb
language plpgsql security definer set search_path = public as $$
declare counts jsonb;
begin
  begin
    counts := apply_plan_data_batch(payload);
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

-- The verify step now also takes the plan data. Same checks as before.
create or replace function verify_planning_rows(rows jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  r jsonb;
  n int := 0;
  hit int;
begin
  for r in select * from jsonb_array_elements(rows) loop
    if r ->> 'table' not in ('institutions', 'majors', 'agreement_links', 'deadlines', 'checklists', 'checklist_steps', 'piq_prompts',
                             'pathways', 'pathway_requirements', 'pathway_campuses', 'opportunities', 'topic_order', 'ge_areas', 'college_courses') then
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

-- Reopening a verified row now covers the plan data too
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
    select 'institutions', i.slug || ': ' || i.name, i.verification_status, i.verified_at into v_table, v_record, v_status, v_verified_at
      from institutions i where i.id = p_id;
  end if;
  if not found then
    select 'majors', i.slug || ' ' || m.slug || ': ' || m.name, m.verification_status, m.verified_at into v_table, v_record, v_status, v_verified_at
      from majors m join institutions i on i.id = m.institution_id where m.id = p_id;
  end if;
  if not found then
    select 'agreement_links', s.slug || ' to ' || r.slug || ', ' || m.slug || ', ' || l.academic_year, l.verification_status, l.verified_at
      into v_table, v_record, v_status, v_verified_at
      from agreement_links l join institutions s on s.id = l.sending_institution_id join institutions r on r.id = l.receiving_institution_id
      join majors m on m.id = l.major_id where l.id = p_id;
  end if;
  if not found then
    select 'pathways', p.slug || ' ' || p.kind || ': ' || p.name, p.verification_status, p.verified_at into v_table, v_record, v_status, v_verified_at
      from pathways p where p.id = p_id;
  end if;
  if not found then
    select 'pathway_requirements', p.slug || ' ' || p.kind || ' ' || q.code || ': ' || q.name, q.verification_status, q.verified_at
      into v_table, v_record, v_status, v_verified_at
      from pathway_requirements q join pathways p on p.id = q.pathway_id where q.id = p_id;
  end if;
  if not found then
    select 'pathway_campuses', p.slug || ' ' || p.kind || ' at ' || i.slug, c.verification_status, c.verified_at
      into v_table, v_record, v_status, v_verified_at
      from pathway_campuses c join pathways p on p.id = c.pathway_id join institutions i on i.id = c.institution_id where c.id = p_id;
  end if;
  if not found then
    select 'opportunities', o.slug || ': ' || o.title, o.verification_status, o.verified_at into v_table, v_record, v_status, v_verified_at
      from opportunities o where o.id = p_id;
  end if;
  if not found then
    select 'topic_order', t.topic || ' after ' || t.before_topic, t.verification_status, t.verified_at into v_table, v_record, v_status, v_verified_at
      from topic_order t where t.id = p_id;
  end if;
  if not found then
    select 'ge_areas', g.pattern || ' ' || g.code || ': ' || g.name, g.verification_status, g.verified_at into v_table, v_record, v_status, v_verified_at
      from ge_areas g where g.id = p_id;
  end if;
  if not found then
    select 'college_courses', i.slug || ' ' || c.code || ' (' || c.academic_year || '): ' || c.title, c.verification_status, c.verified_at
      into v_table, v_record, v_status, v_verified_at
      from college_courses c join institutions i on i.id = c.institution_id where c.id = p_id;
  end if;
  if not found then
    raise exception 'no academic row has id %', p_id;
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

revoke all on function apply_plan_data_batch(jsonb) from public, anon, authenticated;
revoke all on function import_plan_data_batch(jsonb, text, boolean) from public, anon, authenticated;
grant execute on function import_plan_data_batch(jsonb, text, boolean) to service_role;
revoke all on function reopen_verified_row(uuid, text, text, boolean) from public, anon, authenticated;
grant execute on function reopen_verified_row(uuid, text, text, boolean) to service_role;
