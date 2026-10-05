-- Academic data (docs/05-data-model.md) with provenance on every row (docs/06-trust-and-provenance.md).
-- Readable by everyone; written only by local import scripts using the service role.
-- Planning layer (docs/16 → Data approach): only institutions, majors and agreement links get imported until
-- ASSIST grants permission. The course-match tables exist so the shape is right, but stay empty until then.

create type institution_type as enum ('community_college', 'university');
create type verification_status as enum ('unverified', 'conditional', 'verified');
create type requirement_logic as enum ('all_of', 'one_of', 'n_of');
create type articulation_kind as enum ('course_set', 'no_articulation');

-- Keeps updated_at current on every academic table
create function set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- A verified row is never changed or deleted, except by the verify step, which sets stackd.allow_verified_change
create function protect_verified() returns trigger language plpgsql as $$
begin
  if old.verification_status = 'verified' and coalesce(current_setting('stackd.allow_verified_change', true), '') <> 'on' then
    raise exception 'refusing to % verified % row %', lower(tg_op), tg_table_name, old.id
      using errcode = 'check_violation';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end $$;

create table institutions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  institution_type institution_type not null,
  system text,                -- CCC, UC, CSU, private
  state text not null default 'CA',
  city text,
  website text,
  source_name text not null,
  source_url text not null,
  academic_year text not null check (academic_year ~ '^\d{4}-\d{2}$'),
  retrieved_at timestamptz not null,
  verified_at timestamptz,
  verification_status verification_status not null default 'unverified',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (verification_status <> 'verified' or verified_at is not null)
);

create table majors (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions on delete restrict,
  slug text not null check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  degree_type text,           -- BS, BA, AS-T …
  source_name text not null,
  source_url text not null,
  academic_year text not null check (academic_year ~ '^\d{4}-\d{2}$'),
  retrieved_at timestamptz not null,
  verified_at timestamptz,
  verification_status verification_status not null default 'unverified',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, slug),
  check (verification_status <> 'verified' or verified_at is not null)
);

-- The official agreement for one college → university → major → academic year. source_url is the agreement link.
create table agreement_links (
  id uuid primary key default gen_random_uuid(),
  sending_institution_id uuid not null references institutions on delete restrict,
  receiving_institution_id uuid not null references institutions on delete restrict,
  major_id uuid not null references majors on delete restrict,
  source_name text not null,
  source_url text not null check (source_url ~ '^https://'),
  academic_year text not null check (academic_year ~ '^\d{4}-\d{2}$'),
  retrieved_at timestamptz not null,
  verified_at timestamptz,
  verification_status verification_status not null default 'unverified',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sending_institution_id, receiving_institution_id, major_id, academic_year),
  check (sending_institution_id <> receiving_institution_id),
  check (verification_status <> 'verified' or verified_at is not null)
);

create table courses (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions on delete restrict,
  subject text not null,
  course_number text not null,
  title text not null,
  units numeric(4, 1),
  uc_transferable boolean,
  csu_transferable boolean,
  source_name text not null,
  source_url text not null,
  academic_year text not null check (academic_year ~ '^\d{4}-\d{2}$'),
  retrieved_at timestamptz not null,
  verified_at timestamptz,
  verification_status verification_status not null default 'unverified',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, subject, course_number, academic_year),
  check (verification_status <> 'verified' or verified_at is not null)
);

create table requirements (
  id uuid primary key default gen_random_uuid(),
  major_id uuid not null references majors on delete restrict,
  code text not null,         -- a stable key within the major, e.g. math-20a
  name text not null,
  description text,
  category text,
  source_name text not null,
  source_url text not null,
  academic_year text not null check (academic_year ~ '^\d{4}-\d{2}$'),
  retrieved_at timestamptz not null,
  verified_at timestamptz,
  verification_status verification_status not null default 'unverified',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (major_id, code, academic_year),
  check (verification_status <> 'verified' or verified_at is not null)
);

-- "All of", "one of" or "n of" the articulations under it satisfy the requirement
create table requirement_groups (
  id uuid primary key default gen_random_uuid(),
  requirement_id uuid not null references requirements on delete restrict,
  logic requirement_logic not null,
  min_count integer check (min_count > 0),
  notes text,
  source_name text not null,
  source_url text not null,
  academic_year text not null check (academic_year ~ '^\d{4}-\d{2}$'),
  retrieved_at timestamptz not null,
  verified_at timestamptz,
  verification_status verification_status not null default 'unverified',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((logic = 'n_of') = (min_count is not null)),
  check (verification_status <> 'verified' or verified_at is not null)
);

-- What one college's agreement says for a requirement group: a set of its courses taken together,
-- or that no course articulates. Several course_set rows for one group are alternatives.
create table articulations (
  id uuid primary key default gen_random_uuid(),
  requirement_group_id uuid not null references requirement_groups on delete restrict,
  sending_institution_id uuid not null references institutions on delete restrict,
  kind articulation_kind not null,
  conditions text,            -- minimum grade, sequence, department approval …
  source_name text not null,
  source_url text not null,
  academic_year text not null check (academic_year ~ '^\d{4}-\d{2}$'),
  retrieved_at timestamptz not null,
  verified_at timestamptz,
  verification_status verification_status not null default 'unverified',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (verification_status <> 'conditional' or conditions is not null),
  check (verification_status <> 'verified' or verified_at is not null)
);

-- The courses in one course_set articulation (all of them, together)
create table articulation_courses (
  articulation_id uuid not null references articulations on delete cascade,
  course_id uuid not null references courses on delete restrict,
  primary key (articulation_id, course_id)
);

-- Single values the app reads, e.g. the current articulation cycle (06 → Staleness)
create table app_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
insert into app_config (key, value) values ('current_cycle', '"2026-27"');

-- One row per import run, for the audit trail. Service role only.
create table import_runs (
  id uuid primary key default gen_random_uuid(),
  source_file text not null,
  dry_run boolean not null,
  status text not null check (status in ('applied', 'dry_run', 'failed')),
  counts jsonb,
  error text,
  created_at timestamptz not null default now()
);

create index on majors (institution_id);
create index on agreement_links (receiving_institution_id, major_id);
create index on courses (institution_id);
create index on requirements (major_id);
create index on requirement_groups (requirement_id);
create index on articulations (requirement_group_id);
create index on articulations (sending_institution_id);
create index on articulation_courses (course_id);

do $$
declare t text;
begin
  foreach t in array array['institutions', 'majors', 'agreement_links', 'courses', 'requirements', 'requirement_groups', 'articulations'] loop
    execute format('create trigger set_updated_at before update on %I for each row execute function set_updated_at()', t);
    execute format('create trigger protect_verified before update or delete on %I for each row execute function protect_verified()', t);
    execute format('alter table %I enable row level security', t);
    execute format('create policy "Anyone can read" on %I for select to anon, authenticated using (true)', t);
    execute format('revoke insert, update, delete on %I from anon, authenticated', t);
  end loop;
end $$;

alter table articulation_courses enable row level security;
create policy "Anyone can read" on articulation_courses for select to anon, authenticated using (true);
revoke insert, update, delete on articulation_courses from anon, authenticated;

alter table app_config enable row level security;
create policy "Anyone can read" on app_config for select to anon, authenticated using (true);
revoke insert, update, delete on app_config from anon, authenticated;

alter table import_runs enable row level security;
revoke all on import_runs from anon, authenticated;
