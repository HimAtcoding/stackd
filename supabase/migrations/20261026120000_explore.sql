-- Explore (docs/specs/21-explore.md): UC Transfer Pathways and Transfer Model Curriculum templates, their requirements,
-- the UC campuses a pathway covers, and each student's status per course type. Academic rows carry the same provenance
-- and protect_verified guard as institutions, are written only by the import (service role), and reach the app only
-- when every row behind that major is verified.

create type pathway_kind as enum ('uc_pathway', 'tmc');

-- C-ID numbers look like COMP 122 or MATH 900S
create function valid_c_ids(ids text[]) returns boolean language sql immutable as $$
  select coalesce(bool_and(i ~ '^[A-Z]{2,5} \d{3}[A-Z]?$'), true) from unnest(ids) i
$$;

-- A "pick one" requirement's options: [{ "label": text, "c_id": [C-ID, ...], "units": number }], nothing else
create function valid_pathway_options(opts jsonb) returns boolean language sql immutable as $$
  select jsonb_typeof(opts) = 'array' and coalesce((
    select bool_and(
      jsonb_typeof(o) = 'object'
      and (o - 'label' - 'c_id' - 'units') = '{}'::jsonb
      and jsonb_typeof(o -> 'label') = 'string' and length(trim(o ->> 'label')) > 0
      and jsonb_typeof(o -> 'units') = 'number' and (o ->> 'units')::numeric > 0
      and jsonb_typeof(o -> 'c_id') = 'array' and jsonb_array_length(o -> 'c_id') > 0
      and (select bool_and(jsonb_typeof(c) = 'string' and (c #>> '{}') ~ '^[A-Z]{2,5} \d{3}[A-Z]?$') from jsonb_array_elements(o -> 'c_id') c))
    from jsonb_array_elements(case when jsonb_typeof(opts) = 'array' then opts else '[]' end) o), true)
$$;

-- One UC Transfer Pathway or one TMC. Explore's majors are the distinct slugs.
create table pathways (
  id uuid primary key default gen_random_uuid(),
  slug text not null check (slug ~ '^[a-z0-9-]+$'),
  kind pathway_kind not null,
  -- In Stackd's own words
  name text not null check (length(trim(name)) > 0),
  -- TMC template number and revision; null for a UC pathway
  code text check (code ~ '^\d+$'),
  revision text,
  degree_name text,
  major_units numeric(4, 1) check (major_units > 0),
  total_units numeric(4, 1) check (total_units > 0),
  effective_term text check (effective_term ~ '^(fall|winter|spring|summer)-\d{4}$'),
  source_name text not null,
  source_url text not null check (source_url ~ '^https://'),
  academic_year text not null check (academic_year ~ '^\d{4}-\d{2}$'),
  retrieved_at timestamptz not null,
  verified_at timestamptz,
  verification_status verification_status not null default 'unverified',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slug, kind),
  check ((kind = 'tmc') = (code is not null)),
  check (kind <> 'tmc' or (revision is not null and degree_name is not null and major_units is not null and total_units is not null)),
  check (kind = 'tmc' or (revision is null and degree_name is null and major_units is null and total_units is null)),
  check (verification_status <> 'verified' or verified_at is not null)
);

-- One course type in a pathway. A one-course TMC row names its C-ID numbers; a "pick one" row lists its options instead.
create table pathway_requirements (
  id uuid primary key default gen_random_uuid(),
  pathway_id uuid not null references pathways on delete restrict,
  code text not null check (code ~ '^[a-z0-9-]+$'),
  sort smallint not null check (sort > 0),
  -- The same key in every pathway (cs1, calculus-single), so status and "Counts for both" follow the course type
  topic text not null check (topic ~ '^[a-z0-9-]+$'),
  name text not null check (length(trim(name)) > 0),
  description text not null check (length(trim(description)) > 0),
  how_many text not null check (length(trim(how_many)) > 0),
  units numeric(4, 1) check (units > 0),
  c_id text[] not null default '{}' check (valid_c_ids(c_id)),
  options jsonb not null default '[]' check (valid_pathway_options(options)),
  source_name text not null,
  source_url text not null check (source_url ~ '^https://'),
  academic_year text not null check (academic_year ~ '^\d{4}-\d{2}$'),
  retrieved_at timestamptz not null,
  verified_at timestamptz,
  verification_status verification_status not null default 'unverified',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Deferred so a file can reorder rows in one import
  unique (pathway_id, code),
  unique (pathway_id, sort) deferrable initially deferred,
  unique (pathway_id, topic) deferrable initially deferred,
  check (cardinality(c_id) = 0 or options = '[]'::jsonb),
  check (verification_status <> 'verified' or verified_at is not null)
);

-- The UC campuses a UC pathway applies to, with the campus majors it covers there
create table pathway_campuses (
  id uuid primary key default gen_random_uuid(),
  pathway_id uuid not null references pathways on delete restrict,
  institution_id uuid not null references institutions on delete restrict,
  major_names text[] not null check (cardinality(major_names) > 0 and array_position(major_names, '') is null),
  source_name text not null,
  source_url text not null check (source_url ~ '^https://'),
  academic_year text not null check (academic_year ~ '^\d{4}-\d{2}$'),
  retrieved_at timestamptz not null,
  verified_at timestamptz,
  verification_status verification_status not null default 'unverified',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pathway_id, institution_id),
  check (verification_status <> 'verified' or verified_at is not null)
);

create index on pathway_campuses (institution_id);

-- Campuses belong to UC pathways only, and must be UC campuses
create function pathway_campus_is_uc() returns trigger language plpgsql set search_path = public as $$
begin
  if not exists (select 1 from pathways where id = new.pathway_id and kind = 'uc_pathway') then
    raise exception 'campuses belong to a UC pathway, not a TMC' using errcode = 'check_violation';
  end if;
  if not exists (select 1 from institutions where id = new.institution_id and institution_type = 'university' and system = 'UC') then
    raise exception 'a pathway campus must be a UC campus' using errcode = 'check_violation';
  end if;
  return new;
end $$;

create trigger pathway_campus_is_uc before insert or update on pathway_campuses for each row execute function pathway_campus_is_uc();

do $$
declare t text;
begin
  foreach t in array array['pathways', 'pathway_requirements', 'pathway_campuses'] loop
    execute format('create trigger set_updated_at before update on %I for each row execute function set_updated_at()', t);
    execute format('create trigger protect_verified before update or delete on %I for each row execute function protect_verified()', t);
    execute format('alter table %I enable row level security', t);
    execute format('revoke insert, update, delete on %I from anon, authenticated', t);
  end loop;
end $$;

-- True when the pathway's major (its slug) has at least one requirement in every pathway and every pathway,
-- requirement and campus row under it is verified. Security definer so the policies can see rows the reader can't.
create function pathway_major_verified(p_pathway uuid) returns boolean language sql stable security definer set search_path = public as $$
  with major as (select slug from pathways where id = p_pathway),
  rows as (select p.id from pathways p join major m using (slug))
  select exists (select 1 from rows)
    and not exists (select 1 from pathways p join rows using (id) where p.verification_status <> 'verified')
    and not exists (select 1 from rows where not exists (select 1 from pathway_requirements r where r.pathway_id = rows.id))
    and not exists (select 1 from pathway_requirements r join rows on rows.id = r.pathway_id where r.verification_status <> 'verified')
    and not exists (select 1 from pathway_campuses c join rows on rows.id = c.pathway_id where c.verification_status <> 'verified')
$$;

revoke all on function pathway_major_verified(uuid) from public;
grant execute on function pathway_major_verified(uuid) to anon, authenticated, service_role;

-- Anyone can read a major's rows once all of them are verified, and none before (21 → Only verified majors)
create policy "Verified majors can be read" on pathways for select to anon, authenticated
  using (pathway_major_verified(id));
create policy "Verified majors can be read" on pathway_requirements for select to anon, authenticated
  using (pathway_major_verified(pathway_id));
create policy "Verified majors can be read" on pathway_campuses for select to anon, authenticated
  using (pathway_major_verified(pathway_id));

-- Links a plan's major (UC San Diego Computer Science B.S.) to Explore's computer-science. Set by the planning import.
alter table majors add column explore_slug text check (explore_slug ~ '^[a-z0-9-]+$');
create index on majors (explore_slug);

-- The student's status per course type, shared by every pathway with that topic (21 → One status per course type)
create table user_topic_status (
  user_id uuid not null references auth.users on delete cascade,
  topic text not null check (topic ~ '^[a-z0-9-]+$'),
  status progress_status not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, topic)
);

create trigger set_updated_at before update on user_topic_status for each row execute function set_updated_at();

-- Owner-only, like the other per-student tables
alter table user_topic_status enable row level security;
revoke all on user_topic_status from anon;
create policy "Owner can read" on user_topic_status for select to authenticated using ((select auth.uid()) = user_id);
create policy "Owner can add" on user_topic_status for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Owner can change" on user_topic_status for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Owner can remove" on user_topic_status for delete to authenticated using ((select auth.uid()) = user_id);

-- Deleting an account also removes the student's topic statuses by name. The foreign key cascades too.
create or replace function delete_my_account() returns void language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
begin
  if v_user is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;
  delete from public.user_topic_status where user_id = v_user;
  delete from public.review_comments where link_id in (select id from public.review_links where user_id = v_user);
  delete from public.review_links where user_id = v_user;
  delete from public.essay_feedback where user_id = v_user;
  delete from public.essay_drafts where user_id = v_user;
  delete from auth.users where id = v_user;
end $$;

revoke all on function delete_my_account() from public, anon;
grant execute on function delete_my_account() to authenticated;

-- The planning import now also carries majors.explore_slug. Otherwise unchanged from 20261005130000_import_functions.sql.
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

-- The explore import (scripts/import/explore.mjs): same rules as the others. One transaction, all or nothing; unchanged
-- rows are left alone; a file that would change a verified row stops the whole run; imported rows start unverified.
-- A requirement or campus the file no longer lists is removed when unverified, and stops the run when verified.
create function apply_explore_batch(payload jsonb) returns jsonb language plpgsql set search_path = public as $$
declare
  r jsonb;
  existing record;
  v_pathway uuid;
  v_inst uuid;
  outcome text;
  gone record;
  counts jsonb := '{"pathways":{"inserted":0,"updated":0,"unchanged":0},'
    '"pathway_requirements":{"inserted":0,"updated":0,"unchanged":0,"removed":0},'
    '"pathway_campuses":{"inserted":0,"updated":0,"unchanged":0,"removed":0}}';
begin
  for r in select * from jsonb_array_elements(coalesce(payload -> 'pathways', '[]')) loop
    select * into existing from pathways where slug = r ->> 'slug' and kind = (r ->> 'kind')::pathway_kind;
    if not found then
      insert into pathways (slug, kind, name, code, revision, degree_name, major_units, total_units, effective_term,
                            source_name, source_url, academic_year, retrieved_at)
      values (r ->> 'slug', (r ->> 'kind')::pathway_kind, r ->> 'name', r ->> 'code', r ->> 'revision', r ->> 'degree_name',
              (r ->> 'major_units')::numeric, (r ->> 'total_units')::numeric, r ->> 'effective_term',
              r ->> 'source_name', r ->> 'source_url', r ->> 'academic_year', (r ->> 'retrieved_at')::timestamptz);
      outcome := 'inserted';
    elsif (existing.name, existing.code, existing.revision, existing.degree_name, existing.major_units, existing.total_units,
           existing.effective_term, existing.source_name, existing.source_url, existing.academic_year)
          is not distinct from
          (r ->> 'name', r ->> 'code', r ->> 'revision', r ->> 'degree_name', (r ->> 'major_units')::numeric, (r ->> 'total_units')::numeric,
           r ->> 'effective_term', r ->> 'source_name', r ->> 'source_url', r ->> 'academic_year') then
      outcome := 'unchanged';
    elsif existing.verification_status = 'verified' then
      raise exception 'pathway % (%) is verified and the file would change it; nothing was applied', existing.slug, existing.kind;
    else
      update pathways set name = r ->> 'name', code = r ->> 'code', revision = r ->> 'revision', degree_name = r ->> 'degree_name',
        major_units = (r ->> 'major_units')::numeric, total_units = (r ->> 'total_units')::numeric, effective_term = r ->> 'effective_term',
        source_name = r ->> 'source_name', source_url = r ->> 'source_url', academic_year = r ->> 'academic_year',
        retrieved_at = (r ->> 'retrieved_at')::timestamptz
      where id = existing.id;
      outcome := 'updated';
    end if;
    counts := jsonb_set(counts, array['pathways', outcome], to_jsonb((counts #>> array['pathways', outcome])::int + 1));
  end loop;

  for r in select * from jsonb_array_elements(coalesce(payload -> 'pathway_requirements', '[]')) loop
    select id into v_pathway from pathways where slug = r ->> 'pathway' and kind = (r ->> 'kind')::pathway_kind;
    if v_pathway is null then
      raise exception 'requirement % names pathway % (%), which is neither in the file nor in the database', r ->> 'code', r ->> 'pathway', r ->> 'kind';
    end if;
    select * into existing from pathway_requirements where pathway_id = v_pathway and code = r ->> 'code';
    if not found then
      insert into pathway_requirements (pathway_id, code, sort, topic, name, description, how_many, units, c_id, options,
                                        source_name, source_url, academic_year, retrieved_at)
      values (v_pathway, r ->> 'code', (r ->> 'sort')::smallint, r ->> 'topic', r ->> 'name', r ->> 'description', r ->> 'how_many',
              (r ->> 'units')::numeric, array(select jsonb_array_elements_text(r -> 'c_id')), r -> 'options',
              r ->> 'source_name', r ->> 'source_url', r ->> 'academic_year', (r ->> 'retrieved_at')::timestamptz);
      outcome := 'inserted';
    elsif (existing.sort, existing.topic, existing.name, existing.description, existing.how_many, existing.units, existing.c_id,
           existing.options, existing.source_name, existing.source_url, existing.academic_year)
          is not distinct from
          ((r ->> 'sort')::smallint, r ->> 'topic', r ->> 'name', r ->> 'description', r ->> 'how_many', (r ->> 'units')::numeric,
           array(select jsonb_array_elements_text(r -> 'c_id')), r -> 'options', r ->> 'source_name', r ->> 'source_url', r ->> 'academic_year') then
      outcome := 'unchanged';
    elsif existing.verification_status = 'verified' then
      raise exception 'requirement % in pathway % (%) is verified and the file would change it; nothing was applied', existing.code, r ->> 'pathway', r ->> 'kind';
    else
      update pathway_requirements set sort = (r ->> 'sort')::smallint, topic = r ->> 'topic', name = r ->> 'name',
        description = r ->> 'description', how_many = r ->> 'how_many', units = (r ->> 'units')::numeric,
        c_id = array(select jsonb_array_elements_text(r -> 'c_id')), options = r -> 'options', source_name = r ->> 'source_name',
        source_url = r ->> 'source_url', academic_year = r ->> 'academic_year', retrieved_at = (r ->> 'retrieved_at')::timestamptz
      where id = existing.id;
      outcome := 'updated';
    end if;
    counts := jsonb_set(counts, array['pathway_requirements', outcome], to_jsonb((counts #>> array['pathway_requirements', outcome])::int + 1));
  end loop;

  for r in select * from jsonb_array_elements(coalesce(payload -> 'pathway_campuses', '[]')) loop
    select id into v_pathway from pathways where slug = r ->> 'pathway' and kind = (r ->> 'kind')::pathway_kind;
    select id into v_inst from institutions where slug = r ->> 'institution';
    if v_pathway is null or v_inst is null then
      raise exception 'campus % on pathway % (%) names a pathway or school that is neither in the file nor in the database',
        r ->> 'institution', r ->> 'pathway', r ->> 'kind';
    end if;
    select * into existing from pathway_campuses where pathway_id = v_pathway and institution_id = v_inst;
    if not found then
      insert into pathway_campuses (pathway_id, institution_id, major_names, source_name, source_url, academic_year, retrieved_at)
      values (v_pathway, v_inst, array(select jsonb_array_elements_text(r -> 'major_names')), r ->> 'source_name', r ->> 'source_url',
              r ->> 'academic_year', (r ->> 'retrieved_at')::timestamptz);
      outcome := 'inserted';
    elsif (existing.major_names, existing.source_name, existing.source_url, existing.academic_year)
          is not distinct from
          (array(select jsonb_array_elements_text(r -> 'major_names')), r ->> 'source_name', r ->> 'source_url', r ->> 'academic_year') then
      outcome := 'unchanged';
    elsif existing.verification_status = 'verified' then
      raise exception 'campus % on pathway % (%) is verified and the file would change it; nothing was applied', r ->> 'institution', r ->> 'pathway', r ->> 'kind';
    else
      update pathway_campuses set major_names = array(select jsonb_array_elements_text(r -> 'major_names')), source_name = r ->> 'source_name',
        source_url = r ->> 'source_url', academic_year = r ->> 'academic_year', retrieved_at = (r ->> 'retrieved_at')::timestamptz
      where id = existing.id;
      outcome := 'updated';
    end if;
    counts := jsonb_set(counts, array['pathway_campuses', outcome], to_jsonb((counts #>> array['pathway_campuses', outcome])::int + 1));
  end loop;

  -- Rows of the file's pathways that the file no longer lists
  for gone in
    select 'pathway_requirements' as t, q.id, p.slug, p.kind, q.code as what, q.verification_status
      from pathway_requirements q join pathways p on p.id = q.pathway_id
      join jsonb_array_elements(coalesce(payload -> 'pathways', '[]')) f on f ->> 'slug' = p.slug and f ->> 'kind' = p.kind::text
      where not exists (select 1 from jsonb_array_elements(coalesce(payload -> 'pathway_requirements', '[]')) x
                        where x ->> 'pathway' = p.slug and x ->> 'kind' = p.kind::text and x ->> 'code' = q.code)
    union all
    select 'pathway_campuses', c.id, p.slug, p.kind, i.slug, c.verification_status
      from pathway_campuses c join pathways p on p.id = c.pathway_id join institutions i on i.id = c.institution_id
      join jsonb_array_elements(coalesce(payload -> 'pathways', '[]')) f on f ->> 'slug' = p.slug and f ->> 'kind' = p.kind::text
      where not exists (select 1 from jsonb_array_elements(coalesce(payload -> 'pathway_campuses', '[]')) x
                        where x ->> 'pathway' = p.slug and x ->> 'kind' = p.kind::text and x ->> 'institution' = i.slug)
  loop
    if gone.verification_status = 'verified' then
      raise exception '% % on pathway % (%) is verified and the file no longer lists it; reopen it first. Nothing was applied',
        gone.t, gone.what, gone.slug, gone.kind;
    end if;
    execute format('delete from %I where id = $1', gone.t) using gone.id;
    counts := jsonb_set(counts, array[gone.t, 'removed'], to_jsonb((counts #>> array[gone.t, 'removed'])::int + 1));
  end loop;

  return counts;
end $$;

-- The entry point the import script calls. A dry run does all the work, then rolls it back and only logs the run.
create function import_explore_batch(payload jsonb, source_file text, dry_run boolean) returns jsonb
language plpgsql security definer set search_path = public as $$
declare counts jsonb;
begin
  begin
    counts := apply_explore_batch(payload);
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

-- The verify step now also takes the explore tables. Same checks as before.
create or replace function verify_planning_rows(rows jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  r jsonb;
  n int := 0;
  hit int;
begin
  for r in select * from jsonb_array_elements(rows) loop
    if r ->> 'table' not in ('institutions', 'majors', 'agreement_links', 'deadlines', 'checklists', 'checklist_steps', 'piq_prompts',
                             'pathways', 'pathway_requirements', 'pathway_campuses') then
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

-- Reopening a verified row now covers every academic table the import writes: the planning tables and Explore's too
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

revoke all on function apply_explore_batch(jsonb) from public, anon, authenticated;
revoke all on function import_explore_batch(jsonb, text, boolean) from public, anon, authenticated;
grant execute on function import_explore_batch(jsonb, text, boolean) to service_role;
revoke all on function reopen_verified_row(uuid, text, text, boolean) from public, anon, authenticated;
grant execute on function reopen_verified_row(uuid, text, text, boolean) to service_role;
