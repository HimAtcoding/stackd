-- Explore hub (docs/specs/22-explore-hub-opportunities-tabs.md → Data): each school's short name for its tile, and
-- opportunities (research programs, scholarships, competitions, events) in Stackd's own words, each linked to its
-- official page. Opportunities are academic records like deadlines: provenance on every row, written only by the
-- import (service role), protect_verified, and readable only once a person has verified them.

-- The school's own short name (UCSD, SJSU, LPC), shown on its tile. Filled through the planning import.
alter table institutions add column abbreviation text check (abbreviation ~ '^[A-Z0-9]{2,5}$');

create type opportunity_kind as enum ('research', 'scholarship', 'competition', 'program', 'event', 'internship');
-- community_college: current CCC students; admitted_transfer: admitted to or enrolled at a UC or Cal State
create type opportunity_audience as enum ('community_college', 'admitted_transfer', 'any');
-- paid: the student is paid, like a stipend; fee: the student pays
create type opportunity_cost as enum ('free', 'paid', 'fee');

-- True when every value in the list matches the pattern
create function all_match(vals text[], pattern text) returns boolean language sql immutable as $$
  select coalesce(bool_and(v ~ pattern), true) from unnest(vals) v
$$;

-- A JSON list of strings as text[]; null or missing is an empty list
create function jsonb_text_array(j jsonb) returns text[] language sql immutable as $$
  select array(select jsonb_array_elements_text(coalesce(j, '[]')))
$$;

create table opportunities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  kind opportunity_kind not null,
  -- In Stackd's own words, never copied from a post
  title text not null check (length(trim(title)) > 0),
  org_name text not null check (length(trim(org_name)) > 0),
  summary text not null check (length(trim(summary)) > 0),
  -- What Stackd can't check (GPA, citizenship), shown as "Check yourself"
  who_for text[] not null default '{}' check (array_position(who_for, '') is null),
  wants text[] not null default '{}' check (array_position(wants, '') is null),
  offers text[] not null default '{}' check (array_position(offers, '') is null),
  -- Who it's for (22 → 5). An empty list means any.
  audience opportunity_audience not null,
  major_slugs text[] not null default '{}' check (all_match(major_slugs, '^[a-z0-9-]+$')),
  systems text[] not null default '{}' check (systems <@ array['UC', 'CSU']),
  terms text[] not null default '{}' check (all_match(terms, '^(fall|winter|spring|summer)-\d{4}$')),
  -- The last day to apply; null is rolling
  deadline date,
  starts_on date,
  ends_on date,
  location text check (length(trim(location)) > 0),
  online boolean not null default false,
  cost opportunity_cost not null,
  -- The official page the app opens
  url text not null check (url ~ '^https://'),
  source_name text not null,
  source_url text not null check (source_url ~ '^https://'),
  academic_year text not null check (academic_year ~ '^\d{4}-\d{2}$'),
  retrieved_at timestamptz not null,
  verified_at timestamptz,
  verification_status verification_status not null default 'unverified',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (starts_on is null or ends_on is null or starts_on <= ends_on),
  check (verification_status <> 'verified' or verified_at is not null)
);

create index on opportunities (deadline);

create trigger set_updated_at before update on opportunities for each row execute function set_updated_at();
create trigger protect_verified before update or delete on opportunities for each row execute function protect_verified();
alter table opportunities enable row level security;
revoke insert, update, delete on opportunities from anon, authenticated;

create policy "Verified rows can be read" on opportunities for select to anon, authenticated
  using (verification_status = 'verified');

-- The planning import now also carries institutions.abbreviation. Otherwise unchanged from 20261026120000_explore.sql.
create or replace function apply_planning_batch(payload jsonb) returns jsonb language plpgsql set search_path = public as $$
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
      insert into institutions (slug, name, abbreviation, institution_type, system, state, city, website, source_name, source_url, academic_year, retrieved_at)
      values (r ->> 'slug', r ->> 'name', r ->> 'abbreviation', (r ->> 'institution_type')::institution_type, r ->> 'system', coalesce(r ->> 'state', 'CA'),
              r ->> 'city', r ->> 'website', r ->> 'source_name', r ->> 'source_url', r ->> 'academic_year', (r ->> 'retrieved_at')::timestamptz);
      outcome := 'inserted';
    elsif (existing.name, existing.abbreviation, existing.institution_type::text, existing.system, existing.state, existing.city, existing.website,
           existing.source_name, existing.source_url, existing.academic_year)
          is not distinct from
          (r ->> 'name', r ->> 'abbreviation', r ->> 'institution_type', r ->> 'system', coalesce(r ->> 'state', 'CA'), r ->> 'city', r ->> 'website',
           r ->> 'source_name', r ->> 'source_url', r ->> 'academic_year') then
      outcome := 'unchanged';
    elsif existing.verification_status = 'verified' then
      raise exception 'institution % is verified and the file would change it; nothing was applied', existing.slug;
    else
      update institutions set name = r ->> 'name', abbreviation = r ->> 'abbreviation', institution_type = (r ->> 'institution_type')::institution_type,
        system = r ->> 'system', state = coalesce(r ->> 'state', 'CA'), city = r ->> 'city', website = r ->> 'website', source_name = r ->> 'source_name',
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
      insert into majors (institution_id, slug, name, degree_type, explore_slug, source_name, source_url, academic_year, retrieved_at)
      values (v_inst, r ->> 'slug', r ->> 'name', r ->> 'degree_type', r ->> 'explore_slug', r ->> 'source_name', r ->> 'source_url',
              r ->> 'academic_year', (r ->> 'retrieved_at')::timestamptz);
      outcome := 'inserted';
    elsif (existing.name, existing.degree_type, existing.explore_slug, existing.source_name, existing.source_url, existing.academic_year)
          is not distinct from
          (r ->> 'name', r ->> 'degree_type', r ->> 'explore_slug', r ->> 'source_name', r ->> 'source_url', r ->> 'academic_year') then
      outcome := 'unchanged';
    elsif existing.verification_status = 'verified' then
      raise exception 'major %/% is verified and the file would change it; nothing was applied', r ->> 'institution', existing.slug;
    else
      update majors set name = r ->> 'name', degree_type = r ->> 'degree_type', explore_slug = r ->> 'explore_slug',
        source_name = r ->> 'source_name', source_url = r ->> 'source_url', academic_year = r ->> 'academic_year',
        retrieved_at = (r ->> 'retrieved_at')::timestamptz
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

-- The opportunities import (scripts/import/opportunities.mjs): same rules as the deadlines import. One transaction, all
-- or nothing; unchanged rows are left alone; a file that would change a verified row stops the whole run; imported rows
-- start unverified. A row the file no longer lists stays; a past deadline already hides it in the app.
create function apply_opportunities_batch(payload jsonb) returns jsonb language plpgsql set search_path = public as $$
declare
  r jsonb;
  existing record;
  outcome text;
  counts jsonb := '{"opportunities":{"inserted":0,"updated":0,"unchanged":0}}';
begin
  for r in select * from jsonb_array_elements(coalesce(payload -> 'opportunities', '[]')) loop
    select * into existing from opportunities where slug = r ->> 'slug';
    if not found then
      insert into opportunities (slug, kind, title, org_name, summary, who_for, wants, offers, audience, major_slugs, systems, terms,
                                 deadline, starts_on, ends_on, location, online, cost, url, source_name, source_url, academic_year, retrieved_at)
      values (r ->> 'slug', (r ->> 'kind')::opportunity_kind, r ->> 'title', r ->> 'org_name', r ->> 'summary',
              jsonb_text_array(r -> 'who_for'), jsonb_text_array(r -> 'wants'), jsonb_text_array(r -> 'offers'),
              (r ->> 'audience')::opportunity_audience, jsonb_text_array(r -> 'major_slugs'), jsonb_text_array(r -> 'systems'),
              jsonb_text_array(r -> 'terms'), (r ->> 'deadline')::date, (r ->> 'starts_on')::date, (r ->> 'ends_on')::date, r ->> 'location',
              (r ->> 'online')::boolean, (r ->> 'cost')::opportunity_cost, r ->> 'url', r ->> 'source_name', r ->> 'source_url',
              r ->> 'academic_year', (r ->> 'retrieved_at')::timestamptz);
      outcome := 'inserted';
    elsif (existing.kind::text, existing.title, existing.org_name, existing.summary, existing.who_for, existing.wants, existing.offers,
           existing.audience::text, existing.major_slugs, existing.systems, existing.terms, existing.deadline, existing.starts_on,
           existing.ends_on, existing.location, existing.online, existing.cost::text, existing.url, existing.source_name,
           existing.source_url, existing.academic_year)
          is not distinct from
          (r ->> 'kind', r ->> 'title', r ->> 'org_name', r ->> 'summary', jsonb_text_array(r -> 'who_for'), jsonb_text_array(r -> 'wants'),
           jsonb_text_array(r -> 'offers'), r ->> 'audience', jsonb_text_array(r -> 'major_slugs'), jsonb_text_array(r -> 'systems'),
           jsonb_text_array(r -> 'terms'), (r ->> 'deadline')::date, (r ->> 'starts_on')::date, (r ->> 'ends_on')::date, r ->> 'location',
           (r ->> 'online')::boolean, r ->> 'cost', r ->> 'url', r ->> 'source_name', r ->> 'source_url', r ->> 'academic_year') then
      outcome := 'unchanged';
    elsif existing.verification_status = 'verified' then
      raise exception 'opportunity % is verified and the file would change it; nothing was applied', existing.slug;
    else
      update opportunities set kind = (r ->> 'kind')::opportunity_kind, title = r ->> 'title', org_name = r ->> 'org_name',
        summary = r ->> 'summary', who_for = jsonb_text_array(r -> 'who_for'), wants = jsonb_text_array(r -> 'wants'),
        offers = jsonb_text_array(r -> 'offers'), audience = (r ->> 'audience')::opportunity_audience,
        major_slugs = jsonb_text_array(r -> 'major_slugs'), systems = jsonb_text_array(r -> 'systems'), terms = jsonb_text_array(r -> 'terms'),
        deadline = (r ->> 'deadline')::date, starts_on = (r ->> 'starts_on')::date, ends_on = (r ->> 'ends_on')::date,
        location = r ->> 'location', online = (r ->> 'online')::boolean, cost = (r ->> 'cost')::opportunity_cost, url = r ->> 'url',
        source_name = r ->> 'source_name', source_url = r ->> 'source_url', academic_year = r ->> 'academic_year',
        retrieved_at = (r ->> 'retrieved_at')::timestamptz
      where id = existing.id;
      outcome := 'updated';
    end if;
    counts := jsonb_set(counts, array['opportunities', outcome], to_jsonb((counts #>> array['opportunities', outcome])::int + 1));
  end loop;
  return counts;
end $$;

-- The entry point the import script calls. A dry run does all the work, then rolls it back and only logs the run.
create function import_opportunities_batch(payload jsonb, source_file text, dry_run boolean) returns jsonb
language plpgsql security definer set search_path = public as $$
declare counts jsonb;
begin
  begin
    counts := apply_opportunities_batch(payload);
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

-- The verify step now also takes opportunities. Same checks as before.
create or replace function verify_planning_rows(rows jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  r jsonb;
  n int := 0;
  hit int;
begin
  for r in select * from jsonb_array_elements(rows) loop
    if r ->> 'table' not in ('institutions', 'majors', 'agreement_links', 'deadlines', 'checklists', 'checklist_steps', 'piq_prompts',
                             'pathways', 'pathway_requirements', 'pathway_campuses', 'opportunities') then
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

-- Reopening a verified row now covers opportunities too
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

revoke all on function apply_opportunities_batch(jsonb) from public, anon, authenticated;
revoke all on function import_opportunities_batch(jsonb, text, boolean) from public, anon, authenticated;
grant execute on function import_opportunities_batch(jsonb, text, boolean) to service_role;
revoke all on function reopen_verified_row(uuid, text, text, boolean) from public, anon, authenticated;
grant execute on function reopen_verified_row(uuid, text, text, boolean) to service_role;
