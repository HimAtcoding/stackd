-- Review links (docs/specs/19-essay-import-share-review.md → 3): a student shares a snapshot of one essay draft by a
-- private link, and whoever has the link can read that snapshot and leave comments under a name they type, without
-- an account. Students read their own links and comments through row-level security and change them only through
-- the owner-checked functions below. Reviewers never touch the database: the review Edge Function (service role)
-- calls the review_* functions with the link's token.

-- One shared snapshot. Only the token's SHA-256 is kept; the link itself is shown to the student once.
create table review_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  draft_id uuid not null,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  reviewer_label text check (reviewer_label is null or length(reviewer_label) between 1 and 60),
  snapshot_body text not null check (length(snapshot_body) <= 20000),
  snapshot_words integer not null check (snapshot_words >= 0),
  snapshot_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '14 days',
  revoked_at timestamptz,
  -- For Stackd's own mentors later; always null for now
  mentor_id uuid,
  -- Deleting the draft deletes its links, and their comments with them
  foreign key (draft_id, user_id) references essay_drafts (id, user_id) on delete cascade
);

create index on review_links (user_id);
create index on review_links (draft_id);

-- A reviewer's comment on a link's snapshot. quote: the phrase it's about, copied from the snapshot, or null for the
-- whole answer. reviewer_key_hash lets the same browser delete its own comment for 15 minutes; students never see it.
create table review_comments (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references review_links on delete cascade,
  reviewer_name text not null check (length(reviewer_name) between 1 and 60),
  body text not null check (length(body) between 1 and 1000),
  quote text check (quote is null or length(quote) between 1 and 300),
  reviewer_key_hash text not null check (reviewer_key_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  read_at timestamptz,
  deleted_at timestamptz
);

create index on review_comments (link_id, created_at);

-- Students read their own links and those links' comments; nothing else, and no direct writes
alter table review_links enable row level security;
alter table review_comments enable row level security;
revoke all on review_links, review_comments from anon, authenticated;
grant select on review_links to authenticated;
grant select (id, link_id, reviewer_name, body, quote, created_at, resolved_at, read_at, deleted_at) on review_comments to authenticated;
create policy "Owner can read" on review_links for select to authenticated using ((select auth.uid()) = user_id);
create policy "Owner can read" on review_comments for select to authenticated
  using (exists (select 1 from review_links l where l.id = link_id and l.user_id = (select auth.uid())));

-- "abc…" → its SHA-256 as hex. Tokens and reviewer keys are random base64url strings made on the device.
create function review_hash(p_secret text) returns text language sql immutable set search_path = '' as $$
  select encode(sha256(convert_to(p_secret, 'UTF8')), 'hex')
$$;

-- Live: not turned off and not past its 14 days
create function review_link_live(l public.review_links) returns boolean language sql stable set search_path = '' as $$
  select l.revoked_at is null and l.expires_at > now()
$$;

-- The student's side

-- Shares the saved text of the caller's draft for one question. p_token is the link's secret, made on the device and
-- never stored. Returns the new link's id and end date.
create function create_review_link(p_cycle text, p_prompt_key text, p_label text, p_token text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  v_draft public.essay_drafts;
  v_label text := nullif(btrim(coalesce(p_label, '')), '');
  v_link public.review_links;
begin
  if v_user is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;
  if p_token is null or p_token !~ '^[A-Za-z0-9_-]{43}$' then
    raise exception 'invalid token' using errcode = '22023';
  end if;
  if v_label is not null and length(v_label) > 60 then
    raise exception 'reviewer name too long' using errcode = '22023';
  end if;
  select * into v_draft from public.essay_drafts where user_id = v_user and cycle = p_cycle and prompt_key = p_prompt_key;
  if not found or btrim(v_draft.body) = '' then
    raise exception 'no draft to share' using errcode = 'P0002';
  end if;
  -- A backstop against a runaway client, far above what a student needs
  if (select count(*) from public.review_links where user_id = v_user and created_at > now() - interval '1 day') >= 20 then
    raise exception 'too many links today' using errcode = '54000';
  end if;
  insert into public.review_links (user_id, draft_id, token_hash, reviewer_label, snapshot_body, snapshot_words)
  values (v_user, v_draft.id, public.review_hash(p_token), v_label, v_draft.body, v_draft.word_count)
  returning * into v_link;
  return jsonb_build_object('id', v_link.id, 'created_at', v_link.created_at, 'expires_at', v_link.expires_at);
end $$;

-- "Send latest version": the link shows the draft's saved text from now on. Comments stay.
create function refresh_review_snapshot(p_link uuid) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  v_link public.review_links;
begin
  if v_user is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;
  select * into v_link from public.review_links where id = p_link and user_id = v_user;
  if not found then
    raise exception 'no such link' using errcode = 'P0002';
  end if;
  if not public.review_link_live(v_link) then
    raise exception 'link has ended' using errcode = '22023';
  end if;
  update public.review_links l set snapshot_body = d.body, snapshot_words = d.word_count, snapshot_at = now()
  from public.essay_drafts d where l.id = p_link and d.id = l.draft_id
  returning l.* into v_link;
  return jsonb_build_object('id', v_link.id, 'snapshot_at', v_link.snapshot_at, 'snapshot_words', v_link.snapshot_words);
end $$;

-- "Turn off": the link stops opening at once. Comments stay.
create function revoke_review_link(p_link uuid) returns void language plpgsql security definer set search_path = '' as $$
declare v_user uuid := (select auth.uid());
begin
  if v_user is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;
  update public.review_links set revoked_at = coalesce(revoked_at, now()) where id = p_link and user_id = v_user;
  if not found then
    raise exception 'no such link' using errcode = 'P0002';
  end if;
end $$;

-- A comment on one of the caller's links: resolve, unresolve or delete it
create function set_review_comment(p_comment uuid, p_action text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_user uuid := (select auth.uid());
begin
  if v_user is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;
  if p_action not in ('resolve', 'unresolve', 'delete') then
    raise exception 'unknown action %', p_action using errcode = '22023';
  end if;
  update public.review_comments c set
    resolved_at = case p_action when 'resolve' then coalesce(c.resolved_at, now()) when 'unresolve' then null else c.resolved_at end,
    deleted_at = case when p_action = 'delete' then coalesce(c.deleted_at, now()) else c.deleted_at end,
    read_at = coalesce(c.read_at, now())
  from public.review_links l
  where c.id = p_comment and l.id = c.link_id and l.user_id = v_user;
  if not found then
    raise exception 'no such comment' using errcode = 'P0002';
  end if;
end $$;

-- The student has seen a link's comments (the editor's Reviews section). Returns how many changed.
create function mark_review_comments_read(p_link uuid) returns integer language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  n integer;
begin
  if v_user is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;
  update public.review_comments c set read_at = now()
  from public.review_links l
  where c.link_id = p_link and l.id = c.link_id and l.user_id = v_user and c.read_at is null and c.deleted_at is null;
  get diagnostics n = row_count;
  return n;
end $$;

revoke all on function create_review_link(text, text, text, text), refresh_review_snapshot(uuid), revoke_review_link(uuid),
  set_review_comment(uuid, text), mark_review_comments_read(uuid) from public, anon;
grant execute on function create_review_link(text, text, text, text), refresh_review_snapshot(uuid), revoke_review_link(uuid),
  set_review_comment(uuid, text), mark_review_comments_read(uuid) to authenticated;

-- The reviewer's side, called only by the review Edge Function (service role) with the token from the link

-- What the review page shows: the snapshot, the question, the student's first name and the comments. An unknown,
-- turned-off or ended link is just "ended", so a page can't tell them apart.
create function review_open(p_token text, p_reviewer_key text) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_link public.review_links;
  v_key text := case when p_reviewer_key ~ '^[A-Za-z0-9_-]{22,64}$' then public.review_hash(p_reviewer_key) end;
  v_prompt record;
  v_name text;
begin
  select * into v_link from public.review_links where token_hash = public.review_hash(coalesce(p_token, ''));
  if not found or not public.review_link_live(v_link) then
    return jsonb_build_object('status', 'ended');
  end if;
  select p.short_name, p.summary into v_prompt
  from public.essay_drafts d join public.piq_prompts p on p.key = d.prompt_key and p.cycle = d.cycle
  where d.id = v_link.draft_id;
  select nullif(btrim(first_name), '') into v_name from public.profiles where user_id = v_link.user_id;
  return jsonb_build_object(
    'status', 'live',
    'first_name', v_name,
    'short_name', v_prompt.short_name,
    'summary', v_prompt.summary,
    'snapshot', v_link.snapshot_body,
    'words', v_link.snapshot_words,
    'expires_at', v_link.expires_at,
    'comments', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id, 'reviewer_name', c.reviewer_name, 'body', c.body, 'quote', c.quote, 'created_at', c.created_at,
        'mine', c.reviewer_key_hash = v_key,
        'can_delete', c.reviewer_key_hash = v_key and c.created_at > now() - interval '15 minutes'
      ) order by c.created_at)
      from public.review_comments c where c.link_id = v_link.id and c.deleted_at is null
    ), '[]'::jsonb)
  );
end $$;

-- Adds a reviewer's comment. Errors carry a short code the function turns into the page's message.
create function review_add_comment(p_token text, p_reviewer_key text, p_name text, p_body text, p_quote text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_link public.review_links;
  v_name text := btrim(coalesce(p_name, ''));
  v_body text := btrim(coalesce(p_body, ''));
  v_quote text := nullif(btrim(coalesce(p_quote, '')), '');
  v_comment public.review_comments;
begin
  select * into v_link from public.review_links where token_hash = public.review_hash(coalesce(p_token, '')) for update;
  if not found or not public.review_link_live(v_link) then
    raise exception 'review_ended' using errcode = 'P0001';
  end if;
  if coalesce(p_reviewer_key, '') !~ '^[A-Za-z0-9_-]{22,64}$' then
    raise exception 'review_bad_request' using errcode = 'P0001';
  end if;
  if length(v_name) not between 1 and 60 then
    raise exception 'review_bad_name' using errcode = 'P0001';
  end if;
  if length(v_body) not between 1 and 1000 then
    raise exception 'review_bad_comment' using errcode = 'P0001';
  end if;
  if v_quote is not null and (length(v_quote) > 300 or strpos(v_link.snapshot_body, v_quote) = 0) then
    raise exception 'review_bad_quote' using errcode = 'P0001';
  end if;
  -- 60 a day per link, by the Pacific calendar day
  if (select count(*) from public.review_comments where link_id = v_link.id
      and created_at >= (date_trunc('day', now() at time zone 'America/Los_Angeles') at time zone 'America/Los_Angeles')) >= 60 then
    raise exception 'review_daily_limit' using errcode = 'P0001';
  end if;
  insert into public.review_comments (link_id, reviewer_name, body, quote, reviewer_key_hash)
  values (v_link.id, v_name, v_body, v_quote, public.review_hash(p_reviewer_key))
  returning * into v_comment;
  return jsonb_build_object('id', v_comment.id, 'reviewer_name', v_comment.reviewer_name, 'body', v_comment.body,
    'quote', v_comment.quote, 'created_at', v_comment.created_at, 'mine', true, 'can_delete', true);
end $$;

-- A reviewer deletes their own comment, from the same browser, within 15 minutes of adding it
create function review_delete_comment(p_token text, p_reviewer_key text, p_comment uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_link public.review_links;
begin
  select * into v_link from public.review_links where token_hash = public.review_hash(coalesce(p_token, ''));
  if not found or not public.review_link_live(v_link) then
    raise exception 'review_ended' using errcode = 'P0001';
  end if;
  update public.review_comments set deleted_at = now()
  where id = p_comment and link_id = v_link.id and deleted_at is null
    and reviewer_key_hash = public.review_hash(coalesce(p_reviewer_key, ''))
    and created_at > now() - interval '15 minutes';
  if not found then
    raise exception 'review_cant_delete' using errcode = 'P0001';
  end if;
end $$;

revoke all on function review_hash(text), review_link_live(review_links), review_open(text, text),
  review_add_comment(text, text, text, text, text), review_delete_comment(text, text, uuid) from public, anon, authenticated;
grant execute on function review_open(text, text), review_add_comment(text, text, text, text, text),
  review_delete_comment(text, text, uuid) to service_role;
grant execute on function review_hash(text), review_link_live(review_links) to service_role;

-- Deleting an account also removes its review links and their comments by name. The foreign keys cascade too.
create or replace function delete_my_account() returns void language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
begin
  if v_user is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;
  delete from public.review_comments where link_id in (select id from public.review_links where user_id = v_user);
  delete from public.review_links where user_id = v_user;
  delete from public.essay_feedback where user_id = v_user;
  delete from public.essay_drafts where user_id = v_user;
  delete from auth.users where id = v_user;
end $$;

revoke all on function delete_my_account() from public, anon;
grant execute on function delete_my_account() to authenticated;
