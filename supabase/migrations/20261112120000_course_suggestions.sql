-- Courses students type in the Plan's course sheet (24 → 3, Your course) when their college has no verified course for
-- that requirement. Saved for us to check later, never shown to anyone and never treated as academic data: a person
-- checks a suggestion against the college's catalog before anything goes into college_courses.
create table course_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  -- The student's home college when they typed it
  institution_id uuid not null references institutions on delete cascade,
  -- One of the two: the course type or the Cal-GETC area it was typed for
  topic text check (topic ~ '^[a-z0-9-]+$'),
  ge_area text check (ge_area ~ '^\d[A-Z]?$'),
  course_code text not null check (length(trim(course_code)) between 2 and 20),
  units numeric(3, 1) check (units > 0),
  created_at timestamptz not null default now(),
  check ((topic is null) <> (ge_area is null))
);

create index on course_suggestions (institution_id);

-- A student adds their own and can read them back; nobody changes one. We read them with the service role.
alter table course_suggestions enable row level security;
revoke all on course_suggestions from anon;
revoke update, delete on course_suggestions from authenticated;
create policy "Owner can read" on course_suggestions for select to authenticated using ((select auth.uid()) = user_id);
create policy "Owner can add" on course_suggestions for insert to authenticated with check ((select auth.uid()) = user_id);

-- Deleting an account also removes the student's suggestions by name. The foreign key cascades too.
create or replace function delete_my_account() returns void language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
begin
  if v_user is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;
  delete from public.course_suggestions where user_id = v_user;
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
