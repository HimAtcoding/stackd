-- Notes and Finish review (docs/specs/20-essays-start-and-reviews.md → Data). Notes are the student's private scratch
-- space for one question, saved with the draft. They never count toward the word count and never go into a review
-- link. Finish review lets a reviewer tell the student they're done.

-- Up to 12 notes per draft, each { "id": uuid, "starter": "major-1" or null, "body": text }; the app checks each item's
-- shape. Covered by the draft's owner-only row-level security, and deleted with the draft and by delete_my_account().
-- The case keeps jsonb_array_length from running on something that isn't an array.
alter table essay_drafts
  add column notes jsonb not null default '[]'::jsonb,
  add constraint essay_drafts_notes_check check (
    case when jsonb_typeof(notes) = 'array'
      then jsonb_array_length(notes) <= 12 and length(notes::text) <= 30000
      else false
    end
  );

-- Null until the reviewer taps Finish review. Students already read review_links through the table grant and the
-- owner policy.
alter table review_links add column finished_at timestamptz;

-- "Send latest version" now also clears Finished, so the reviewer can finish the new version again
create or replace function refresh_review_snapshot(p_link uuid) returns jsonb language plpgsql security definer set search_path = '' as $$
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
  update public.review_links l set snapshot_body = d.body, snapshot_words = d.word_count, snapshot_at = now(), finished_at = null
  from public.essay_drafts d where l.id = p_link and d.id = l.draft_id
  returning l.* into v_link;
  return jsonb_build_object('id', v_link.id, 'snapshot_at', v_link.snapshot_at, 'snapshot_words', v_link.snapshot_words);
end $$;

-- review_open, now also returning finished_at
create or replace function review_open(p_token text, p_reviewer_key text) returns jsonb language plpgsql security definer set search_path = '' as $$
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
    'finished_at', v_link.finished_at,
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

-- Finish review: the link must exist, not be turned off and not be past its 14 days. finished_at is set only the
-- first time, so finishing again changes nothing. Returns what review_open returns.
create function review_finish(p_token text, p_reviewer_key text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_link public.review_links;
begin
  select * into v_link from public.review_links where token_hash = public.review_hash(coalesce(p_token, '')) for update;
  if not found or not public.review_link_live(v_link) then
    raise exception 'review_ended' using errcode = 'P0001';
  end if;
  update public.review_links set finished_at = now() where id = v_link.id and finished_at is null;
  return public.review_open(p_token, p_reviewer_key);
end $$;

revoke all on function review_finish(text, text) from public, anon, authenticated;
grant execute on function review_finish(text, text) to service_role;
