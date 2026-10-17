-- Deadlines and application checklists (docs/specs/14-deadlines.md), with each student's marks and transfer term.
-- Dates and steps are academic records: provenance on every row, written only by the import scripts (service role),
-- and the app can read a row only once a person has verified it, so an unchecked date never reaches a student.

create type deadline_audience as enum ('uc', 'csu', 'aid', 'campus');
create type deadline_kind as enum ('application', 'update', 'aid', 'decision', 'enroll', 'documents');

create table deadlines (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  -- The entry term the date belongs to, e.g. fall-2027
  cycle text not null check (cycle ~ '^(fall|winter|spring|summer)-\d{4}$'),
  -- uc, csu, aid (financial aid, for everyone), or campus with the one school it's for
  audience deadline_audience not null,
  institution_id uuid references institutions on delete restrict,
  kind deadline_kind not null,
  title text not null,
  summary text not null,
  opens_at timestamptz,
  -- For "11:59 p.m. Pacific" the exact instant, with due_has_time true. A date with no stated time is stored at
  -- 23:59:59 Pacific on its day, with due_has_time false, so the app never shows a time the source didn't give.
  due_at timestamptz not null,
  due_has_time boolean not null default false,
  varies_by_campus boolean not null default false,
  source_name text not null,
  source_url text not null check (source_url ~ '^https://'),
  retrieved_at timestamptz not null,
  verified_at timestamptz,
  verification_status verification_status not null default 'unverified',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((audience = 'campus') = (institution_id is not null)),
  check (opens_at is null or opens_at < due_at),
  check (verification_status <> 'verified' or verified_at is not null)
);

-- The steps of one application in one cycle, tied to the date it's due (14 → Get ready card)
create table checklists (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  cycle text not null check (cycle ~ '^(fall|winter|spring|summer)-\d{4}$'),
  deadline_id uuid not null unique references deadlines on delete restrict,
  name text not null,
  apply_label text not null,
  apply_url text not null check (apply_url ~ '^https://'),
  source_name text not null,
  source_url text not null check (source_url ~ '^https://'),
  retrieved_at timestamptz not null,
  verified_at timestamptz,
  verification_status verification_status not null default 'unverified',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (verification_status <> 'verified' or verified_at is not null)
);

create table checklist_steps (
  id uuid primary key default gen_random_uuid(),
  checklist_id uuid not null references checklists on delete restrict,
  position smallint not null check (position > 0),
  title text not null,
  summary text not null,
  source_name text not null,
  source_url text not null check (source_url ~ '^https://'),
  retrieved_at timestamptz not null,
  verified_at timestamptz,
  verification_status verification_status not null default 'unverified',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (checklist_id, position),
  check (verification_status <> 'verified' or verified_at is not null)
);

create index on deadlines (cycle);
create index on deadlines (institution_id);
create index on checklist_steps (checklist_id);

do $$
declare t text;
begin
  foreach t in array array['deadlines', 'checklists', 'checklist_steps'] loop
    execute format('create trigger set_updated_at before update on %I for each row execute function set_updated_at()', t);
    execute format('create trigger protect_verified before update or delete on %I for each row execute function protect_verified()', t);
    execute format('alter table %I enable row level security', t);
    execute format('revoke insert, update, delete on %I from anon, authenticated', t);
  end loop;
end $$;

-- Only verified rows, and a checklist or step only when everything above it is verified too
create policy "Verified rows can be read" on deadlines for select to anon, authenticated
  using (verification_status = 'verified');
create policy "Verified rows can be read" on checklists for select to anon, authenticated
  using (verification_status = 'verified'
    and exists (select 1 from deadlines d where d.id = deadline_id and d.verification_status = 'verified'));
create policy "Verified rows can be read" on checklist_steps for select to anon, authenticated
  using (verification_status = 'verified'
    and exists (select 1 from checklists c where c.id = checklist_id and c.verification_status = 'verified'));

-- The student's marks. reminders: days before the due date (7, 3, 1, or 0 for the morning it's due);
-- null follows the default the student picked in Settings (1 week and 1 day before until they change it).
create table user_deadlines (
  user_id uuid not null references auth.users on delete cascade,
  deadline_id uuid not null references deadlines on delete cascade,
  done_at timestamptz,
  reminders smallint[] check (reminders <@ '{7,3,1,0}'::smallint[]),
  updated_at timestamptz not null default now(),
  primary key (user_id, deadline_id)
);

create table user_checklist_steps (
  user_id uuid not null references auth.users on delete cascade,
  step_id uuid not null references checklist_steps on delete cascade,
  done_at timestamptz not null default now(),
  primary key (user_id, step_id)
);

create trigger set_updated_at before update on user_deadlines for each row execute function set_updated_at();

-- Owner-only, like the other per-student tables
do $$
declare t text;
begin
  foreach t in array array['user_deadlines', 'user_checklist_steps'] loop
    execute format('alter table %I enable row level security', t);
    execute format('revoke all on %I from anon', t);
    execute format('create policy "Owner can read" on %I for select to authenticated using ((select auth.uid()) = user_id)', t);
    execute format('create policy "Owner can add" on %I for insert to authenticated with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "Owner can change" on %I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "Owner can remove" on %I for delete to authenticated using ((select auth.uid()) = user_id)', t);
  end loop;
end $$;

-- The term the student plans to transfer for (14 → Profile addition). Null with transfer_term_asked true is
-- "Not sure yet"; transfer_term_asked false means the Deadlines screen still asks.
alter table profiles add column transfer_term text check (transfer_term ~ '^(fall|winter|spring|summer)-\d{4}$');
alter table profiles add column transfer_term_asked boolean not null default false;
alter table profiles add constraint profiles_transfer_term_asked_check check (transfer_term is null or transfer_term_asked);
