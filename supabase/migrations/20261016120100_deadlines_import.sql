-- The import pipeline's database side for deadlines and checklists (scripts/import/deadlines.mjs). Same rules as
-- the planning import: one transaction, all or nothing; unchanged rows are left alone; a file that would change a
-- verified row stops the whole run; imported rows always start unverified. Only the service role can call these.

create function apply_deadlines_batch(payload jsonb) returns jsonb language plpgsql set search_path = public as $$
declare
  r jsonb;
  existing record;
  v_inst uuid;
  v_deadline uuid;
  v_checklist uuid;
  outcome text;   -- inserted, updated or unchanged, counted per table
  counts jsonb := '{"deadlines":{"inserted":0,"updated":0,"unchanged":0},"checklists":{"inserted":0,"updated":0,"unchanged":0},"checklist_steps":{"inserted":0,"updated":0,"unchanged":0}}';
begin
  for r in select * from jsonb_array_elements(coalesce(payload -> 'deadlines', '[]')) loop
    v_inst := null;
    if r ->> 'institution' is not null then
      select id into v_inst from institutions where slug = r ->> 'institution';
      if v_inst is null then
        raise exception 'deadline % names institution %, which is not in the database', r ->> 'slug', r ->> 'institution';
      end if;
    end if;
    select * into existing from deadlines where slug = r ->> 'slug';
    if not found then
      insert into deadlines (slug, cycle, audience, institution_id, kind, title, summary, opens_at, due_at, due_has_time, varies_by_campus,
                             source_name, source_url, retrieved_at)
      values (r ->> 'slug', r ->> 'cycle', (r ->> 'audience')::deadline_audience, v_inst, (r ->> 'kind')::deadline_kind, r ->> 'title',
              r ->> 'summary', (r ->> 'opens_at')::timestamptz, (r ->> 'due_at')::timestamptz, (r ->> 'due_has_time')::boolean,
              (r ->> 'varies_by_campus')::boolean, r ->> 'source_name', r ->> 'source_url', (r ->> 'retrieved_at')::timestamptz);
      outcome := 'inserted';
    elsif (existing.cycle, existing.audience::text, existing.institution_id, existing.kind::text, existing.title, existing.summary,
           existing.opens_at, existing.due_at, existing.due_has_time, existing.varies_by_campus, existing.source_name, existing.source_url)
          is not distinct from
          (r ->> 'cycle', r ->> 'audience', v_inst, r ->> 'kind', r ->> 'title', r ->> 'summary',
           (r ->> 'opens_at')::timestamptz, (r ->> 'due_at')::timestamptz, (r ->> 'due_has_time')::boolean,
           (r ->> 'varies_by_campus')::boolean, r ->> 'source_name', r ->> 'source_url') then
      outcome := 'unchanged';
    elsif existing.verification_status = 'verified' then
      raise exception 'deadline % is verified and the file would change it; nothing was applied', existing.slug;
    else
      update deadlines set cycle = r ->> 'cycle', audience = (r ->> 'audience')::deadline_audience, institution_id = v_inst,
        kind = (r ->> 'kind')::deadline_kind, title = r ->> 'title', summary = r ->> 'summary', opens_at = (r ->> 'opens_at')::timestamptz,
        due_at = (r ->> 'due_at')::timestamptz, due_has_time = (r ->> 'due_has_time')::boolean,
        varies_by_campus = (r ->> 'varies_by_campus')::boolean, source_name = r ->> 'source_name', source_url = r ->> 'source_url',
        retrieved_at = (r ->> 'retrieved_at')::timestamptz
      where id = existing.id;
      outcome := 'updated';
    end if;
    counts := jsonb_set(counts, array['deadlines', outcome], to_jsonb((counts #>> array['deadlines', outcome])::int + 1));
  end loop;

  for r in select * from jsonb_array_elements(coalesce(payload -> 'checklists', '[]')) loop
    select id into v_deadline from deadlines where slug = r ->> 'deadline';
    if v_deadline is null then
      raise exception 'checklist % names deadline %, which is neither in the file nor in the database', r ->> 'slug', r ->> 'deadline';
    end if;
    select * into existing from checklists where slug = r ->> 'slug';
    if not found then
      insert into checklists (slug, cycle, deadline_id, name, apply_label, apply_url, source_name, source_url, retrieved_at)
      values (r ->> 'slug', r ->> 'cycle', v_deadline, r ->> 'name', r ->> 'apply_label', r ->> 'apply_url', r ->> 'source_name',
              r ->> 'source_url', (r ->> 'retrieved_at')::timestamptz);
      outcome := 'inserted';
    elsif (existing.cycle, existing.deadline_id, existing.name, existing.apply_label, existing.apply_url, existing.source_name, existing.source_url)
          is not distinct from
          (r ->> 'cycle', v_deadline, r ->> 'name', r ->> 'apply_label', r ->> 'apply_url', r ->> 'source_name', r ->> 'source_url') then
      outcome := 'unchanged';
    elsif existing.verification_status = 'verified' then
      raise exception 'checklist % is verified and the file would change it; nothing was applied', existing.slug;
    else
      update checklists set cycle = r ->> 'cycle', deadline_id = v_deadline, name = r ->> 'name', apply_label = r ->> 'apply_label',
        apply_url = r ->> 'apply_url', source_name = r ->> 'source_name', source_url = r ->> 'source_url',
        retrieved_at = (r ->> 'retrieved_at')::timestamptz
      where id = existing.id;
      outcome := 'updated';
    end if;
    counts := jsonb_set(counts, array['checklists', outcome], to_jsonb((counts #>> array['checklists', outcome])::int + 1));
  end loop;

  for r in select * from jsonb_array_elements(coalesce(payload -> 'checklist_steps', '[]')) loop
    select id into v_checklist from checklists where slug = r ->> 'checklist';
    if v_checklist is null then
      raise exception 'step % of checklist % names a checklist that is neither in the file nor in the database', r ->> 'position', r ->> 'checklist';
    end if;
    select * into existing from checklist_steps where checklist_id = v_checklist and position = (r ->> 'position')::smallint;
    if not found then
      insert into checklist_steps (checklist_id, position, title, summary, source_name, source_url, retrieved_at)
      values (v_checklist, (r ->> 'position')::smallint, r ->> 'title', r ->> 'summary', r ->> 'source_name', r ->> 'source_url',
              (r ->> 'retrieved_at')::timestamptz);
      outcome := 'inserted';
    elsif (existing.title, existing.summary, existing.source_name, existing.source_url)
          is not distinct from (r ->> 'title', r ->> 'summary', r ->> 'source_name', r ->> 'source_url') then
      outcome := 'unchanged';
    elsif existing.verification_status = 'verified' then
      raise exception 'step % of checklist % is verified and the file would change it; nothing was applied', r ->> 'position', r ->> 'checklist';
    else
      update checklist_steps set title = r ->> 'title', summary = r ->> 'summary', source_name = r ->> 'source_name',
        source_url = r ->> 'source_url', retrieved_at = (r ->> 'retrieved_at')::timestamptz
      where id = existing.id;
      outcome := 'updated';
    end if;
    counts := jsonb_set(counts, array['checklist_steps', outcome], to_jsonb((counts #>> array['checklist_steps', outcome])::int + 1));
  end loop;

  return counts;
end $$;

-- The entry point the import script calls. A dry run does all the work, then rolls it back and only logs the run.
create function import_deadlines_batch(payload jsonb, source_file text, dry_run boolean) returns jsonb
language plpgsql security definer set search_path = public as $$
declare counts jsonb;
begin
  begin
    counts := apply_deadlines_batch(payload);
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

-- The verify step now also takes deadlines, checklists and checklist steps. Same checks as before: the row must
-- still have the source_url and updated_at the reviewer saw, or nothing is verified.
create or replace function verify_planning_rows(rows jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  r jsonb;
  n int := 0;
  hit int;
begin
  for r in select * from jsonb_array_elements(rows) loop
    if r ->> 'table' not in ('institutions', 'majors', 'agreement_links', 'deadlines', 'checklists', 'checklist_steps') then
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

revoke all on function apply_deadlines_batch(jsonb) from public, anon, authenticated;
revoke all on function import_deadlines_batch(jsonb, text, boolean) from public, anon, authenticated;
grant execute on function import_deadlines_batch(jsonb, text, boolean) to service_role;
