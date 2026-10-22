"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Art } from "@/components/art";
import { InlineError } from "@/components/ui/inline-error";
import { Loading } from "@/components/ui/loading";
import { TintedButton } from "@/components/ui/tinted-button";
import { Toast } from "@/components/ui/toast";
import { UnofficialFooter } from "@/components/ui/unofficial-footer";
import { cn } from "@/lib/cn";
import { longDate } from "@/lib/deadlines";
import { WORD_LIMIT } from "@/lib/essays";
import { findQuote, highlightRuns, makeSecret, REVIEW_ERRORS, REVIEW_FAILED } from "@/lib/review";
import { readStorage, writeStorage } from "@/lib/storage";
import { CommentList, type Comment } from "./comment-list";
import { CommentComposer, CommentSheet, type ComposerProps } from "./comment-sheet";
import { PhraseSheet } from "./phrase-sheet";

// The reviewer's side of a review link (19 → Reviewer side), rebuilt text-first (20 → Reviewer page). Everything goes
// through the review Edge Function; this page never reads the database. The reviewer's name and a random key for
// deleting their own comments are kept in this browser only.

type Live = {
  status: "live";
  first_name: string | null;
  short_name: string;
  summary: string;
  snapshot: string;
  words: number;
  expires_at: string;
  comments: Comment[];
};
type PageState = { status: "loading" } | { status: "error" } | { status: "ended" } | Live;

const NAME_KEY = "stackd.reviewerName";
const KEY_KEY = "stackd.reviewerKey";
const QUOTE_MAX = 300;
// How long a tapped phrase or comment stays outlined
const OUTLINE_MS = 1200;
// The pinned bar's height on phones, without the safe area
const BAR_HEIGHT = 60;

function reviewerKey(): string {
  const saved = readStorage(KEY_KEY);
  if (saved && /^[A-Za-z0-9_-]{22,64}$/.test(saved)) return saved;
  const made = makeSecret(24);
  writeStorage(KEY_KEY, made);
  return made;
}

type Reply = { ok: true; data: unknown } | { ok: false; error: string };

async function callReview(body: Record<string, unknown>): Promise<Reply> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return { ok: false, error: "review_failed" };
  try {
    const res = await fetch(`${url}/functions/v1/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: anonKey },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (res.ok) return { ok: true, data };
    return { ok: false, error: typeof data?.error === "string" ? data.error : "review_failed" };
  } catch {
    return { ok: false, error: "review_failed" };
  }
}

// What the page shows for a token: the answer and its comments, or the ended message
async function openPage(token: string): Promise<PageState> {
  const reply = await callReview({ action: "open", t: token, k: reviewerKey() });
  if (!reply.ok) return reply.error === "review_ended" ? { status: "ended" } : { status: "error" };
  return reply.data as Live | { status: "ended" };
}

const message = (code: string) => REVIEW_ERRORS[code] ?? REVIEW_FAILED;

// 900 and wider: the comments move to a rail beside the text (20 → Wide)
const WIDE = "(min-width: 900px)";
function useWide() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(WIDE);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(WIDE).matches,
    () => false,
  );
}

// A value that clears itself after 1.2 s, for outlining what a tap points at
function useMoment<T>(): [T | null, (value: T) => void] {
  const [value, setValue] = useState<T | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  return [
    value,
    (next: T) => {
      if (timer.current) clearTimeout(timer.current);
      setValue(next);
      timer.current = setTimeout(() => setValue(null), OUTLINE_MS);
    },
  ];
}

export function ReviewPage() {
  const token = useSearchParams().get("t") ?? "";
  // A malformed link can't be live, so it shows the ended message without asking
  const wellFormed = /^[A-Za-z0-9_-]{43}$/.test(token);
  const [loaded, setState] = useState<PageState>({ status: "loading" });
  const state: PageState = wellFormed ? loaded : { status: "ended" };

  // Bumped by Try again
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!wellFormed) return;
    let current = true;
    openPage(token).then((next) => {
      if (current) setState(next);
    });
    return () => {
      current = false;
    };
  }, [wellFormed, token, attempt]);

  if (state.status === "live") return <LiveReview page={state} token={token} onChange={setState} />;

  return (
    <main
      className="mx-auto min-h-dvh max-w-[688px] bg-sky-50"
      style={{ paddingTop: "calc(var(--safe-top) + 24px)", paddingBottom: "calc(var(--safe-bottom) + 24px)" }}
    >
      <div className="px-6">
        <Art id="wordmark" width={100} label="Stackd" preload />
      </div>
      {state.status === "loading" && (
        <div className="pt-16">
          <Loading label="Opening the answer" />
        </div>
      )}
      {state.status === "error" && (
        <div className="mx-4 mt-8">
          <InlineError
            title="Couldn't open this answer"
            body="Check your connection, then try again."
            action={
              <TintedButton
                onClick={() => {
                  setState({ status: "loading" });
                  setAttempt((n) => n + 1);
                }}
              >
                Try again
              </TintedButton>
            }
          />
        </div>
      )}
      {state.status === "ended" && (
        <div className="px-6 pt-8">
          <h1 className="text-navy-900 type-title-1">Review request</h1>
          <p className="mt-3 max-w-[480px] text-slate-700 type-body">This review link has ended. Ask the student for a new one.</p>
        </div>
      )}
      <UnofficialFooter className="mt-12 px-4" />
    </main>
  );
}

// The comment being written: on a phrase, or on the whole answer (quote null)
type Draft = { quote: string | null; body: string; open: boolean };

function LiveReview({ page, token, onChange }: { page: Live; token: string; onChange: (s: PageState) => void }) {
  const wide = useWide();
  const textRef = useRef<HTMLDivElement>(null);
  const [savedName, setSavedName] = useState(() => readStorage(NAME_KEY) ?? "");
  const [name, setName] = useState(savedName);
  const [askName, setAskName] = useState(!savedName);
  const [selection, setSelection] = useState<{ text: string; top: number; left: number } | null>(null);
  // The selection when the bar's button was pressed or focused. Moving focus to it can clear the selection (Safari).
  const [held, setHeld] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [phrase, setPhrase] = useState<{ quote: string; start: number; end: number; open: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ key: number; text: string } | null>(null);
  const [outlinedSpan, outlineSpan] = useMoment<{ start: number; end: number }>();
  const [outlinedComments, outlineComments] = useMoment<string[]>();

  const say = (text: string) => setToast((t) => ({ key: (t?.key ?? 0) + 1, text }));

  // A selection inside the answer offers "Comment" just above it, and turns the bar's button into Comment on selection
  useEffect(() => {
    function onSelect() {
      const sel = window.getSelection();
      const box = textRef.current;
      if (!sel || sel.isCollapsed || !box || !sel.rangeCount || !box.contains(sel.anchorNode) || !box.contains(sel.focusNode)) {
        setSelection(null);
        return;
      }
      const text = sel.toString().trim();
      if (!text) return setSelection(null);
      // Above the selection's first line, so a selection across lines doesn't put it over other words
      const range = sel.getRangeAt(0);
      const rect = range.getClientRects()[0] ?? range.getBoundingClientRect();
      const outer = box.getBoundingClientRect();
      setSelection({ text, top: rect.top - outer.top, left: Math.min(Math.max(rect.left - outer.left + rect.width / 2, 48), outer.width - 48) });
    }
    document.addEventListener("selectionchange", onSelect);
    return () => document.removeEventListener("selectionchange", onSelect);
  }, []);

  function openComposer(quote: string | null) {
    setDraft((d) => ({ quote, body: d && d.quote === quote ? d.body : "", open: true }));
    setPhrase((p) => (p ? { ...p, open: false } : p));
    setError(null);
    setNameError(null);
  }

  function commentOnSelection(text: string) {
    const quote = text.trim().slice(0, QUOTE_MAX);
    if (!page.snapshot.includes(quote)) return say(REVIEW_ERRORS.review_bad_quote);
    window.getSelection()?.removeAllRanges();
    setSelection(null);
    openComposer(quote);
  }

  function closeComposer() {
    setDraft((d) => (d ? { ...d, open: false } : d));
  }

  async function add() {
    if (!draft) return;
    const trimmedName = (askName ? name : savedName).trim();
    if (!trimmedName || trimmedName.length > 60) {
      setAskName(true);
      return setNameError(REVIEW_ERRORS.review_bad_name);
    }
    if (!draft.body.trim()) return setError(REVIEW_ERRORS.review_bad_comment);
    setNameError(null);
    setError(null);
    setBusy(true);
    const reply = await callReview({ action: "add", t: token, k: reviewerKey(), name: trimmedName, body: draft.body.trim(), quote: draft.quote });
    setBusy(false);
    if (!reply.ok) {
      if (reply.error === "review_ended") return onChange({ status: "ended" });
      return setError(message(reply.error));
    }
    writeStorage(NAME_KEY, trimmedName);
    setSavedName(trimmedName);
    setName(trimmedName);
    setAskName(false);
    onChange({ ...page, comments: [...page.comments, reply.data as Comment] });
    setDraft((d) => (d ? { ...d, body: "", open: false } : d));
    say("Comment added.");
  }

  async function remove(id: string) {
    const reply = await callReview({ action: "delete", t: token, k: reviewerKey(), id });
    if (!reply.ok) {
      if (reply.error === "review_ended") return onChange({ status: "ended" });
      return say(message(reply.error));
    }
    const comments = page.comments.filter((c) => c.id !== id);
    onChange({ ...page, comments });
    say("Comment deleted.");
    // The phrase sheet closes once its phrase has no comments left
    if (phrase && !commentsOn(comments, phrase).length) setPhrase({ ...phrase, open: false });
  }

  // Comments whose phrase overlaps a stretch of the text
  function commentsOn(list: Comment[], at: { start: number; end: number }) {
    return list.filter((c) => {
      const span = c.quote ? findQuote(page.snapshot, c.quote) : null;
      return span && span.start < at.end && at.start < span.end;
    });
  }

  // Tapping a highlight: the phrase sheet on phones; on wide screens its comments are outlined in the rail
  function openPhrase(quote: string, start: number, end: number) {
    const on = commentsOn(page.comments, { start, end });
    if (!wide) return setPhrase({ quote, start, end, open: true });
    outlineComments(on.map((c) => c.id));
    if (on[0]) document.getElementById(`rc-${on[0].id}`)?.scrollIntoView({ block: "nearest" });
  }

  // Tapping a comment's quote scrolls to its phrase and outlines it
  function showPhrase(comment: Comment) {
    const span = comment.quote ? findQuote(page.snapshot, comment.quote) : null;
    if (!span) return;
    outlineSpan(span);
    const mark = [...(textRef.current?.querySelectorAll<HTMLElement>("mark[data-start]") ?? [])].find(
      (m) => Number(m.dataset.start) < span.end && span.start < Number(m.dataset.end),
    );
    mark?.scrollIntoView({ block: "center" });
  }

  const asker = page.first_name ?? "A student";
  const runs = highlightRuns(page.snapshot, page.comments.map((c) => c.quote ?? ""));
  let offset = 0;
  const placed = runs.map((r) => {
    const start = offset;
    offset += r.text.length;
    return { ...r, start, end: offset };
  });

  const composer: ComposerProps | null = draft && {
    quote: draft.quote,
    body: draft.body,
    onBody: (body) => setDraft({ ...draft, body }),
    savedName,
    name,
    onName: setName,
    askName,
    onChangeName: () => {
      setName(savedName);
      setAskName(true);
    },
    nameError,
    error,
    busy,
    onAdd: add,
  };

  // The bar's one button: on the selection while there is one, otherwise on the whole answer. Never disabled.
  const barButton = (
    <button
      type="button"
      onPointerDown={() => setHeld(selection?.text ?? null)}
      onFocus={() => setHeld(selection?.text ?? null)}
      onBlur={() => setHeld(null)}
      // Keeps the selection while the button is pressed with a mouse
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => {
        const text = selection?.text ?? held;
        setHeld(null);
        if (text) commentOnSelection(text);
        else openComposer(null);
      }}
      className="-my-3 py-3 text-left text-blue-600 type-label pressed:underline focus-ring:underline"
    >
      {selection || held ? "Comment on selection" : "Comment on the whole answer"}
    </button>
  );

  const comments = (
    <section aria-labelledby="comments-title">
      <h2 id="comments-title" className="text-navy-900 type-title-3">
        Comments ({page.comments.length})
      </h2>
      {page.comments.length === 0 ? (
        <p className="mt-3 text-slate-600 type-body">No comments yet. Select a sentence to comment on it.</p>
      ) : (
        <div className="mt-3">
          <CommentList comments={page.comments} snapshot={page.snapshot} outlined={outlinedComments ?? []} onQuote={showPhrase} onDelete={remove} />
        </div>
      )}
    </section>
  );

  const fineprint = (
    <div className="mt-10 max-w-[480px] space-y-3 text-slate-600 type-caption">
      <p>Only people with this link can see this answer. It ends on {longDate(page.expires_at)}.</p>
      <p>
        By commenting you agree to Stackd&apos;s{" "}
        <a href="/terms/" className="text-blue-600 underline">
          Terms
        </a>
        . Keep it about the writing; abusive comments are removed.{" "}
        <a href="/privacy/" className="text-blue-600 underline">
          Privacy
        </a>
      </p>
    </div>
  );

  return (
    <main
      className="min-h-dvh bg-sky-50"
      style={{
        paddingTop: "calc(var(--safe-top) + 24px)",
        paddingBottom: wide ? "calc(var(--safe-bottom) + 24px)" : `calc(var(--safe-bottom) + ${BAR_HEIGHT + 24}px)`,
      }}
    >
      <div className="mx-auto flex max-w-[688px] items-start justify-center gap-12 min-[900px]:max-w-[1056px] min-[900px]:px-6">
        <div className="w-full min-w-0 max-w-[688px] min-[900px]:max-w-[640px]">
          <div className="px-6">
            <Art id="wordmark" width={100} label="Stackd" preload />
          </div>

          <div className="px-6 pt-8">
            <h1 className="text-navy-900 type-title-1">{asker} would like your feedback</h1>
            <p className="mt-2 max-w-[520px] text-slate-700 type-body">On a UC personal insight answer. Select any sentence to comment on it.</p>
          </div>

          {/* The same band as the editor's strip, so the page looks like the app */}
          <section aria-labelledby="question" className="mt-6 bg-tint-indigo px-6 py-4">
            <div className="flex items-baseline gap-3">
              <h2 id="question" className="min-w-0 flex-1 text-navy-900 type-title-3">
                {page.short_name}
              </h2>
              <span className="shrink-0 text-slate-700 tabular-nums type-caption">
                {page.words} of {WORD_LIMIT} words
              </span>
            </div>
            <p className="mt-1 text-slate-700 type-body">{page.summary}</p>
          </section>

          <div className="relative mt-6 max-w-[640px] px-6">
            <div ref={textRef} className="whitespace-pre-wrap break-words text-navy-900 type-body-lg [line-height:1.6]">
              {placed.map((r, i) =>
                r.quote ? (
                  <mark
                    key={i}
                    data-start={r.start}
                    data-end={r.end}
                    tabIndex={0}
                    role="button"
                    aria-label={`Comments on "${r.text}"`}
                    onClick={() => openPhrase(r.text, r.start, r.end)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openPhrase(r.text, r.start, r.end);
                      }
                    }}
                    className={cn(
                      "scroll-my-24 rounded-[2px] bg-tint-indigo text-navy-900 underline decoration-indigo-600 decoration-2 underline-offset-[3px] [text-decoration-skip-ink:none] [box-decoration-break:clone] [-webkit-box-decoration-break:clone]",
                      "outline-2 outline-offset-2",
                      outlinedSpan && outlinedSpan.start < r.end && r.start < outlinedSpan.end ? "outline outline-indigo-600" : "outline-transparent",
                    )}
                  >
                    {r.text}
                  </mark>
                ) : (
                  <span key={i}>{r.text}</span>
                ),
              )}
            </div>
            {selection && !draft?.open && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => commentOnSelection(selection.text)}
                className="absolute z-10 -translate-x-1/2 -translate-y-full rounded-full bg-indigo-600 px-4 py-2 text-white shadow-float type-label"
                style={{ top: selection.top - 8, left: selection.left + 24 }}
              >
                Comment
              </button>
            )}
          </div>

          {!wide && page.comments.length > 0 && <div className="mt-10 px-6">{comments}</div>}

          <div className="px-6">{fineprint}</div>
          <UnofficialFooter className="mt-12 px-4" />
        </div>

        {wide && (
          // The rail: the composer on top while writing, the comments, and the bar's button as its last row
          <aside
            aria-label="Comments"
            className="sticky top-6 flex max-h-[calc(100dvh-48px)] w-[320px] shrink-0 flex-col"
          >
            {composer && draft?.open && (
              <section aria-labelledby="composer-title" className="mb-6 shrink-0 rounded-md border border-border bg-surface p-4">
                <div className="flex items-baseline gap-3">
                  <h2 id="composer-title" className="min-w-0 flex-1 text-navy-900 type-title-3">
                    {draft.quote === null ? "Comment on the whole answer" : "Comment on this part"}
                  </h2>
                  <button type="button" onClick={closeComposer} className="-my-3 shrink-0 py-3 text-slate-600 type-label pressed:underline focus-ring:underline">
                    Cancel
                  </button>
                </div>
                <CommentComposer {...composer} />
              </section>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">{comments}</div>
            <div className="flex h-[60px] shrink-0 items-center border-t border-border px-2">{barButton}</div>
          </aside>
        )}
      </div>

      {!wide && (
        <>
          {/* The pinned bar (20 → Pinned bar) */}
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface" style={{ paddingBottom: "var(--safe-bottom)" }}>
            <div className="mx-auto flex h-[59px] max-w-[688px] items-center px-6 py-2">{barButton}</div>
          </div>
          {composer && <CommentSheet open={Boolean(draft?.open)} onClose={closeComposer} {...composer} />}
          {phrase && (
            <PhraseSheet
              open={phrase.open}
              quote={phrase.quote}
              comments={commentsOn(page.comments, phrase)}
              onAdd={() => openComposer(phrase.quote)}
              onDelete={remove}
              onClose={() => setPhrase({ ...phrase, open: false })}
            />
          )}
        </>
      )}

      {toast && (
        <Toast
          key={toast.key}
          message={toast.text}
          bottom={wide ? "calc(var(--safe-bottom) + 24px)" : `calc(var(--safe-bottom) + ${BAR_HEIGHT + 12}px)`}
          onDone={() => setToast(null)}
          overSheet
        />
      )}
    </main>
  );
}
