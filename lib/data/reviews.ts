import { useEffect, useMemo, useSyncExternalStore } from "react";
import { draftKey } from "@/lib/essays";
import { essaysHref } from "@/lib/features";
import { readSessionUser } from "@/lib/profile";
import { makeSecret, reviewUrl } from "@/lib/review";
import { getSupabase } from "@/lib/supabase/client";
import { draftSaved } from "./essays";

// The student's review links and the comments on them (19 → Student side). Read through row-level security (owner
// only) and changed only through the owner-checked database functions. Kept in memory, not on the phone: they're
// read again whenever the editor, Essays or Home opens.

export type ReviewComment = {
  id: string;
  link_id: string;
  reviewer_name: string;
  body: string;
  quote: string | null;
  created_at: string;
  resolved_at: string | null;
  read_at: string | null;
};

export type ReviewLink = {
  id: string;
  // "fall-2027/major", the draft it shares
  key: string;
  reviewer_label: string | null;
  snapshot_body: string;
  snapshot_at: string;
  created_at: string;
  expires_at: string;
  revoked_at: string | null;
  // When the reviewer tapped Finish review (20 → 6); cleared by Send latest version
  finished_at: string | null;
  comments: ReviewComment[];
};

type State = { userId: string; links: ReviewLink[] } | null;

let state: State = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());
const subscribe = (onChange: () => void) => {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
};
const getState = () => state;

const LINK_COLUMNS = "id, draft_id, reviewer_label, snapshot_body, snapshot_at, created_at, expires_at, revoked_at, finished_at";
const COMMENT_COLUMNS = "id, link_id, reviewer_name, body, quote, created_at, resolved_at, read_at";

let loading: Promise<void> | null = null;

// Reads the student's links, their drafts' keys and the comments. A failed read keeps what's there.
export function loadReviews(): Promise<void> {
  const supabase = getSupabase();
  const userId = readSessionUser()?.id;
  if (!essaysHref() || !supabase || !userId) return Promise.resolve();
  if (loading) return loading;
  loading = (async () => {
    const [links, drafts, comments] = await Promise.all([
      supabase.from("review_links").select(LINK_COLUMNS).order("created_at", { ascending: false }),
      supabase.from("essay_drafts").select("id, prompt_key, cycle"),
      supabase.from("review_comments").select(COMMENT_COLUMNS).is("deleted_at", null).order("created_at", { ascending: false }),
    ]);
    if (links.error || drafts.error || comments.error || readSessionUser()?.id !== userId) return;
    const keyOf = new Map((drafts.data as { id: string; prompt_key: string; cycle: string }[]).map((d) => [d.id, draftKey(d.cycle, d.prompt_key)]));
    const byLink = new Map<string, ReviewComment[]>();
    for (const c of comments.data as ReviewComment[]) byLink.set(c.link_id, [...(byLink.get(c.link_id) ?? []), c]);
    state = {
      userId,
      links: (links.data as (Omit<ReviewLink, "key" | "comments"> & { draft_id: string })[])
        .filter((l) => keyOf.has(l.draft_id))
        .map(({ draft_id, ...l }) => ({ ...l, key: keyOf.get(draft_id) as string, comments: byLink.get(l.id) ?? [] })),
    };
    notify();
  })()
    .catch(() => {})
    .finally(() => {
      loading = null;
    });
  return loading;
}

// This account's links, or none while another account's are still in memory
function ownLinks(s: State): ReviewLink[] {
  return s && s.userId === readSessionUser()?.id ? s.links : [];
}

// One draft's links, newest first, read again when the editor opens
export function useDraftReviews(key: string): ReviewLink[] {
  const s = useSyncExternalStore(subscribe, getState, () => null);
  useEffect(() => {
    loadReviews();
  }, []);
  return useMemo(() => ownLinks(s).filter((l) => l.key === key), [s, key]);
}

// Unread comments across every link, for Home's Essays row (19 → "{n} new comments")
export function useUnreadComments(): number {
  const s = useSyncExternalStore(subscribe, getState, () => null);
  useEffect(() => {
    loadReviews();
  }, []);
  return ownLinks(s).reduce((n, l) => n + l.comments.filter((c) => !c.read_at).length, 0);
}

export type CreateResult = { ok: true; url: string } | { ok: false; reason: "offline" | "failed" };

// Makes a private link to the account's copy of a draft. The token is made here and shown only in this result.
export async function createReviewLink(cycle: string, promptKey: string, label: string): Promise<CreateResult> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, reason: "failed" };
  if (!(await draftSaved(cycle, promptKey))) return { ok: false, reason: navigator.onLine === false ? "offline" : "failed" };
  const token = makeSecret(32);
  const { error } = await supabase.rpc("create_review_link", { p_cycle: cycle, p_prompt_key: promptKey, p_label: label.trim() || null, p_token: token });
  if (error) return { ok: false, reason: error.code ? "failed" : "offline" };
  await loadReviews();
  return { ok: true, url: reviewUrl(token) };
}

async function call(fn: string, args: Record<string, unknown>): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { error } = await supabase.rpc(fn, args);
  if (!error) await loadReviews();
  return !error;
}

// "Send latest version": saves the draft first, so the link gets what's on screen
export async function sendLatestVersion(link: ReviewLink): Promise<boolean> {
  const [cycle, promptKey] = link.key.split("/");
  if (!(await draftSaved(cycle, promptKey))) return false;
  return call("refresh_review_snapshot", { p_link: link.id });
}

export const turnOffLink = (linkId: string) => call("revoke_review_link", { p_link: linkId });

export const setComment = (commentId: string, action: "resolve" | "unresolve" | "delete") =>
  call("set_review_comment", { p_comment: commentId, p_action: action });

// The editor shows a draft's comments: they're read. Marks them here first, so the count drops at once.
export async function markRead(links: ReviewLink[]) {
  const unread = links.filter((l) => l.comments.some((c) => !c.read_at));
  if (!unread.length) return;
  const now = new Date().toISOString();
  const ids = new Set(unread.map((l) => l.id));
  if (state) {
    state = { ...state, links: state.links.map((l) => (ids.has(l.id) ? { ...l, comments: l.comments.map((c) => ({ ...c, read_at: c.read_at ?? now })) } : l)) };
    notify();
  }
  const supabase = getSupabase();
  if (!supabase) return;
  await Promise.all(unread.map((l) => supabase.rpc("mark_review_comments_read", { p_link: l.id })));
}

// Sign-out leaves nothing behind
export function clearReviews() {
  state = null;
  notify();
}
