-- The import pipeline's database side (scripts/import). Only the service role can call these.
-- Planning layer (docs/16 → Data approach): institutions, majors and agreement links only. Course-match tables
-- are never written here; that waits for permission recorded in docs/16.

-- Applies one hand-written planning file in a single transaction: all of it or none of it.
-- A row that already exists and is verified is left alone when nothing differs, and stops the whole batch when
-- the file would change it. Imported rows always start unverified.
create function apply_planning_batch(payload jsonb) returns jsonb language plpgsql set search_path = public as $$
declare
  r jsonb;
  existing record;
  v_inst uuid;
  v_send uuid;
  v_recv uuid;
  v_major uuid;
  outcome text;   -- inserted, updated or unchanged, counted per table
  counts jsonb := '{"institutions":{"inserted":0,"updated":0,"unchanged":0},"majors":{"inserted":0,"updated":0,"unchanged":0},"agreement_links":{"inserted":0,"updated":0,"unchanged":0}}';
begin
  for r in select * from jsonb_array_elements(coalesce(payload -> 'institutions', '[]')) loop
    select * into existing from institutions where slug = r ->> 'slug';
    if not found then
      insert into institutions (slug, name, institution_type, system, state, city, website, source_name, source_url, academic_year, retrieved_at)
      values (r ->> 'slug', r ->> 'name', (r ->> 'institution_type')::institution_type, r ->> 'system', coalesce(r ->> 'state', 'CA'),
              r ->> 'city', r ->> 'website', r ->> 'source_name', r ->> 'source_url', r ->> 'academic_year', (r ->> 'retrieved_at')::timestamptz);
      outcome := 'inserted';
    elsif (existing.name, existing.institution_type::text, existing.system, existing.state, existing.city, existing.website,
           existing.source_name, existing.source_url, existing.academic_year)
          is not distinct from
          (r ->> 'name', r ->> 'institution_type', r ->> 'system', coalesce(r ->> 'state', 'CA'), r ->> 'city', r ->> 'website',
           r ->> 'source_name', r ->> 'source_url', r ->> 'academic_year') then
      outcome := 'unchanged';
    elsif existing.verification_status = 'verified' then
      raise exception 'institution % is verified and the file would change it; nothing was applied', existing.slug;
    else
      update institutions set name = r ->> 'name', institution_type = (r ->> 'institution_type')::institution_type, system = r ->> 'system',
        state = coalesce(r ->> 'state', 'CA'), city = r ->> 'city', website = r ->> 'website', source_name = r ->> 'source_name',
        source_url = r ->> 'source_url', academic_year = r ->> 'academic_year', retrieved_at = (r ->> 'retrieved_at')::timestamptz
      where id = existing.id;
      outcome := 'updated';
    end if;
    counts := jsonb_set(counts, array['institutions', outcome], to_jsonb((counts #>> array['institutions', outcome])::int + 1));
  end loop;

  for r in select * from jsonb_array_elements(coalesce(payload -> 'majors', '[]')) loop
    select id into v_inst from institutions where slug = r ->> 'institution';
    if v_inst is null then
      raise exception 'major % names institution %, which is neither in the file nor in the database', r ->> 'slug', r ->> 'institution';
    end if;
    select * into existing from majors where institution_id = v_inst and slug = r ->> 'slug';
    if not found then
      insert into majors (institution_id, slug, name, degree_type, source_name, source_url, academic_year, retrieved_at)
      values (v_inst, r ->> 'slug', r ->> 'name', r ->> 'degree_type', r ->> 'source_name', r ->> 'source_url', r ->> 'academic_year',
              (r ->> 'retrieved_at')::timestamptz);
      outcome := 'inserted';
    elsif (existing.name, existing.degree_type, existing.source_name, existing.source_url, existing.academic_year)
          is not distinct from
          (r ->> 'name', r ->> 'degree_type', r ->> 'source_name', r ->> 'source_url', r ->> 'academic_year') then
      outcome := 'unchanged';
    elsif existing.verification_status = 'verified' then
      raise exception 'major %/% is verified and the file would change it; nothing was applied', r ->> 'institution', existing.slug;
    else
      update majors set name = r ->> 'name', degree_type = r ->> 'degree_type', source_name = r ->> 'source_name',
        source_url = r ->> 'source_url', academic_year = r ->> 'academic_year', retrieved_at = (r ->> 'retrieved_at')::timestamptz
      where id = existing.id;
      outcome := 'updated';
    end if;
    counts := jsonb_set(counts, array['majors', outcome], to_jsonb((counts #>> array['majors', outcome])::int + 1));
  end loop;

  for r in select * from jsonb_array_elements(coalesce(payload -> 'agreement_links', '[]')) loop
    select id into v_send from institutions where slug = r ->> 'sending';
    select id into v_recv from institutions where slug = r ->> 'receiving';
    select id into v_major from majors where institution_id = v_recv and slug = r ->> 'major';
    if v_send is null or v_recv is null or v_major is null then
      raise exception 'agreement link % → % (%) names a college, school or major that is neither in the file nor in the database',
        r ->> 'sending', r ->> 'receiving', r ->> 'major';
    end if;
    select * into existing from agreement_links
      where sending_institution_id = v_send and receiving_institution_id = v_recv and agreement_links.major_id = v_major
        and academic_year = r ->> 'academic_year';
    if not found then
      insert into agreement_links (sending_institution_id, receiving_institution_id, major_id, source_name, source_url, academic_year, retrieved_at)
      values (v_send, v_recv, v_major, r ->> 'source_name', r ->> 'source_url', r ->> 'academic_year', (r ->> 'retrieved_at')::timestamptz);
      outcome := 'inserted';
    elsif (existing.source_name, existing.source_url) is not distinct from (r ->> 'source_name', r ->> 'source_url') then
      outcome := 'unchanged';
    elsif existing.verification_status = 'verified' then
      raise exception 'agreement link % → % (%, %) is verified and the file would change it; nothing was applied',
        r ->> 'sending', r ->> 'receiving', r ->> 'major', r ->> 'academic_year';
    else
      update agreement_links set source_name = r ->> 'source_name', source_url = r ->> 'source_url', retrieved_at = (r ->> 'retrieved_at')::timestamptz
      where id = existing.id;
      outcome := 'updated';
    end if;
    counts := jsonb_set(counts, array['agreement_links', outcome], to_jsonb((counts #>> array['agreement_links', outcome])::int + 1));
  end loop;

  return counts;
end $$;

-- The entry point the import script calls. A dry run does all the work, then rolls it back and only logs the run.
create function import_planning_batch(payload jsonb, source_file text, dry_run boolean) returns jsonb
language plpgsql security definer set search_path = public as $$
declare counts jsonb;
begin
  begin
    counts := apply_planning_batch(payload);
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

-- Marks reviewed rows verified. Each row must still point at the source_url the reviewer checked and still have the
-- updated_at it had in the review report, so a row that changed after it was checked can't be verified. All or none.
create function verify_planning_rows(rows jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  r jsonb;
  n int := 0;
  hit int;
begin
  for r in select * from jsonb_array_elements(rows) loop
    if r ->> 'table' not in ('institutions', 'majors', 'agreement_links') then
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

revoke all on function apply_planning_batch(jsonb) from public, anon, authenticated;
revoke all on function import_planning_batch(jsonb, text, boolean) from public, anon, authenticated;
revoke all on function verify_planning_rows(jsonb) from public, anon, authenticated;
grant execute on function import_planning_batch(jsonb, text, boolean) to service_role;
grant execute on function verify_planning_rows(jsonb) to service_role;
