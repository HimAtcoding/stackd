-- Per-student data. Each student can read and write only their own rows.

create type progress_status as enum ('not_started', 'in_progress', 'done');

create table profiles (
  user_id uuid primary key references auth.users on delete cascade,
  first_name text,
  home_institution_id uuid references institutions on delete set null,
  catalog_year text check (catalog_year ~ '^\d{4}-\d{2}$'),
  ge_pattern_eligibility text,   -- cal-getc, igetc, csu-ge (docs/04 → Cal-GETC)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table user_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  institution_id uuid not null references institutions on delete cascade,
  major_id uuid references majors on delete cascade,
  created_at timestamptz not null default now(),
  unique nulls not distinct (user_id, institution_id, major_id)
);

create table user_requirement_status (
  user_id uuid not null references auth.users on delete cascade,
  requirement_id uuid not null references requirements on delete cascade,
  status progress_status not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, requirement_id)
);

create table saved_courses (
  user_id uuid not null references auth.users on delete cascade,
  course_id uuid not null references courses on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

create table saved_schools (
  user_id uuid not null references auth.users on delete cascade,
  institution_id uuid not null references institutions on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, institution_id)
);

create index on user_targets (user_id);

create trigger set_updated_at before update on profiles for each row execute function set_updated_at();
create trigger set_updated_at before update on user_requirement_status for each row execute function set_updated_at();

-- Owner-only access on every per-student table
do $$
declare t text;
begin
  foreach t in array array['profiles', 'user_targets', 'user_requirement_status', 'saved_courses', 'saved_schools'] loop
    execute format('alter table %I enable row level security', t);
    execute format('revoke all on %I from anon', t);
    execute format('create policy "Owner can read" on %I for select to authenticated using ((select auth.uid()) = user_id)', t);
    execute format('create policy "Owner can add" on %I for insert to authenticated with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "Owner can change" on %I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "Owner can remove" on %I for delete to authenticated using ((select auth.uid()) = user_id)', t);
  end loop;
end $$;

-- Every new account gets a profile, with the first name Create account sent as user metadata
create function create_profile() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (user_id, first_name)
  values (new.id, nullif(trim(new.raw_user_meta_data ->> 'first_name'), ''));
  return new;
end $$;

create trigger create_profile after insert on auth.users for each row execute function create_profile();
