-- The student's plan (docs/specs/10-onboarding.md) and deleting an account (docs/specs/11-settings.md).

-- Schools saved in one go share a created_at, so the order they were chosen in needs its own column
alter table user_targets add column position smallint not null default 0;

-- A missing major means one of two things: the student chose "Not listed yet" (true), or hasn't picked one (false),
-- as with a school added later from Settings. The app words them differently, so it has to know which.
alter table user_targets add column major_not_listed boolean not null default false;
alter table user_targets add constraint user_targets_major_not_listed_check check (not (major_not_listed and major_id is not null));

-- Saves the plan in one transaction: all of it or none of it. Runs as the student, so row-level security applies.
-- p_update_home: set the home college (null means "My college isn't listed").
-- p_targets: null leaves the targets alone; otherwise they're replaced by this list, in order:
--   [{ "institution_id": uuid, "major_id": uuid or null, "major_not_listed": true when the student chose "Not listed yet" }]
create function save_plan(p_home_institution_id uuid, p_update_home boolean, p_targets jsonb)
returns void language plpgsql security invoker set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
begin
  if v_user is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;

  if p_update_home then
    if p_home_institution_id is not null and not exists (
      select 1 from public.institutions where id = p_home_institution_id and institution_type = 'community_college'
    ) then
      raise exception 'home college % is not a community college on record', p_home_institution_id using errcode = '23514';
    end if;
    insert into public.profiles (user_id, home_institution_id) values (v_user, p_home_institution_id)
    on conflict (user_id) do update set home_institution_id = excluded.home_institution_id;
  end if;

  if p_targets is not null then
    if jsonb_typeof(p_targets) <> 'array' then
      raise exception 'targets must be a list' using errcode = '22023';
    end if;
    if (select count(*) <> count(distinct t ->> 'institution_id') from jsonb_array_elements(p_targets) t) then
      raise exception 'a school can only be in the plan once' using errcode = '23505';
    end if;
    if exists (
      select 1 from jsonb_array_elements(p_targets) t
      where not exists (
        select 1 from public.institutions i where i.id = (t ->> 'institution_id')::uuid and i.institution_type = 'university'
      )
    ) then
      raise exception 'every target must be a university on record' using errcode = '23514';
    end if;
    if exists (
      select 1 from jsonb_array_elements(p_targets) t
      where t ->> 'major_id' is not null and not exists (
        select 1 from public.majors m
        where m.id = (t ->> 'major_id')::uuid and m.institution_id = (t ->> 'institution_id')::uuid
      )
    ) then
      raise exception 'a major must belong to its school' using errcode = '23514';
    end if;

    -- A school that leaves the plan takes the student's saved progress for it along (10 → Editing from Settings)
    delete from public.user_requirement_status s
    using public.requirements r, public.majors m
    where s.user_id = v_user
      and r.id = s.requirement_id
      and m.id = r.major_id
      and m.institution_id in (select ut.institution_id from public.user_targets ut where ut.user_id = v_user)
      and m.institution_id not in (select (t ->> 'institution_id')::uuid from jsonb_array_elements(p_targets) t);

    delete from public.user_targets where user_id = v_user;
    insert into public.user_targets (user_id, institution_id, major_id, major_not_listed, position)
    select v_user, (t.value ->> 'institution_id')::uuid, (t.value ->> 'major_id')::uuid,
           coalesce((t.value ->> 'major_not_listed')::boolean, false), t.ordinality
    from jsonb_array_elements(p_targets) with ordinality t;
  end if;
end $$;

-- Deletes the signed-in student's own account and nothing else: it takes no id. profiles, user_targets,
-- user_requirement_status, saved_courses and saved_schools go with it (on delete cascade), and so does every session.
-- Security definer because the app's roles can't touch auth.users.
create function delete_my_account() returns void language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
begin
  if v_user is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;
  delete from auth.users where id = v_user;
end $$;

revoke all on function save_plan(uuid, boolean, jsonb) from public, anon;
revoke all on function delete_my_account() from public, anon;
grant execute on function save_plan(uuid, boolean, jsonb) to authenticated;
grant execute on function delete_my_account() to authenticated;
