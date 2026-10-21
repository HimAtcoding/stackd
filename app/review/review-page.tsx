"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Art } from "@/components/art";
import { InlineError } from "@/components/ui/inline-error";
import { Loading } from "@/components/ui/loading";
import { PrimaryButton } from "@/components/ui/primary-button";
import { TextField } from "@/components/ui/text-field";
import { TintedButton } from "@/components/ui/tinted-button";
import { UnofficialFooter } from "@/components/ui/unofficial-footer";
import { cn } from "@/lib/cn";
import { longDate, shortDate } from "@/lib/deadlines";
import { highlightRuns, makeSecret, REVIEW_ERRORS, REVIEW_FAILED } from "@/lib/review";
import { readStorage, writeStorage } from "@/lib/storage";

// The reviewer's side of a review link (19 → Reviewer side). Everything goes through the review Edge Function; this
// page never reads the database. The reviewer's name and a random key for deleting their own comments are kept in
// this browser only.

type Comment = { id: string; reviewer_name: string; body: string; quote: string | null; created_at: string; mine: boolean; can_delete: boolean };
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
const COMMENT_MAX = 1000;

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
          <InlineError title="Couldn't open this answer" body="Check your connection, then try again." action={
              <TintedButton
                onClick={() => {
                  setState({ status: "loading" });
                  setAttempt((n) => n + 1);
                }}
              >
                Try again
              </TintedButton>
            } />
        </div>
      )}
      {state.status === "ended" && (
        <div className="px-6 pt-8">
          <h1 className="text-navy-900 type-title-1">Review request</h1>
          <p className="mt-3 max-w-[480px] text-slate-700 type-body">This review link has ended. Ask the student for a new one.</p>
        </div>
      )}
      {state.status === "live" && <LiveReview page={state} token={token} onChange={setState} />}
      <UnofficialFooter className="mt-12 px-4" />
    </main>
  );
}

type Draft = { quote: string | null; body: string };

function LiveReview({ page, token, onChange }: { page: Live; token: string; onChange: (s: PageState) => void }) {
  const textRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState(() => readStorage(NAME_KEY) ?? "");
  const [whole, setWhole] = useState("");
  const [selection, setSelection] = useState<{ text: string; top: number; left: number } | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);

  // A selection inside the answer offers "Comment" just above it
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

  function startQuote() {
    if (!selection) return;
    const quote = selection.text.slice(0, QUOTE_MAX);
    if (!page.snapshot.includes(quote)) return setError(REVIEW_ERRORS.review_bad_quote);
    setDraft({ quote, body: "" });
    setError(null);
    window.getSelection()?.removeAllRanges();
    setSelection(null);
  }

  async function add(quote: string | null, body: string, done: () => void) {
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length > 60) return setNameError(REVIEW_ERRORS.review_bad_name);
    if (!body.trim()) return setError(REVIEW_ERRORS.review_bad_comment);
    setNameError(null);
    setError(null);
    setBusy(true);
    writeStorage(NAME_KEY, trimmedName);
    const reply = await callReview({ action: "add", t: token, k: reviewerKey(), name: trimmedName, body: body.trim(), quote });
    setBusy(false);
    if (!reply.ok) {
      if (reply.error === "review_ended") return onChange({ status: "ended" });
      return setError(message(reply.error));
    }
    onChange({ ...page, comments: [...page.comments, reply.data as Comment] });
    done();
  }

  async function remove(id: string) {
    const reply = await callReview({ action: "delete", t: token, k: reviewerKey(), id });
    if (!reply.ok) {
      if (reply.error === "review_ended") return onChange({ status: "ended" });
      return setError(message(reply.error));
    }
    onChange({ ...page, comments: page.comments.filter((c) => c.id !== id) });
  }

  const runs = highlightRuns(page.snapshot, page.comments.map((c) => c.quote ?? ""));
  const asker = page.first_name ?? "A student";

  return (
    <>
      <div className="px-6 pt-8">
        <h1 className="text-navy-900 type-title-1">Review request</h1>
        <p className="mt-2 max-w-[480px] text-slate-700 type-body">{asker} asked you to review a UC personal insight answer.</p>
      </div>

      <section aria-labelledby="question" className="mx-4 mt-6 rounded-md border border-border bg-surface px-4 py-4">
        <div className="flex items-baseline gap-3">
          <h2 id="question" className="min-w-0 flex-1 text-navy-900 type-row-title">
            {page.short_name}
          </h2>
          <span className="shrink-0 text-slate-600 tabular-nums type-caption">{page.words} words</span>
        </div>
        <p className="mt-1 text-slate-600 type-caption">{page.summary}</p>
      </section>

      <div className="relative mx-6 mt-6">
        <div ref={textRef} className="whitespace-pre-wrap break-words border-l-2 border-indigo-600 pl-4 text-navy-900 type-body-lg">
          {runs.map((r, i) =>
            r.quote ? (
              <mark
                key={i}
                tabIndex={0}
                role="button"
                aria-label={`Comments on "${r.quote}"`}
                onClick={() => setFocused(r.quote)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setFocused(r.quote);
                  }
                }}
                className={cn("rounded-[2px] bg-tint-indigo text-navy-900", focused === r.quote && "outline outline-2 outline-indigo-600")}
              >
                {r.text}
              </mark>
            ) : (
              <span key={i}>{r.text}</span>
            ),
          )}
        </div>
        {selection && !draft && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={startQuote}
            className="absolute z-10 -translate-x-1/2 -translate-y-full rounded-full bg-indigo-600 px-4 py-2 text-white shadow-float type-label"
            style={{ top: selection.top - 8, left: selection.left }}
          >
            Comment
          </button>
        )}
      </div>

      <div className="mt-4 px-6">
        <p className="text-slate-600 type-caption">Select any part of the text to comment on it.</p>
        {/* The same flow by keyboard: select with Shift + arrows, then this button */}
        <button
          type="button"
          disabled={!selection}
          onClick={startQuote}
          className="-my-3 mt-1 py-3 text-blue-600 type-label pressed:underline focus-ring:underline disabled:text-slate-600 disabled:opacity-60"
        >
          Comment on selection
        </button>
      </div>

      {draft && (
        <section aria-labelledby="quote-title" className="mx-4 mt-4 rounded-md border border-border bg-surface px-4 py-4">
          <h2 id="quote-title" className="text-navy-900 type-label">
            Comment on this part
          </h2>
          <p className="mt-2 border-l-2 border-indigo-600 pl-3 text-slate-600 type-caption">&ldquo;{draft.quote}&rdquo;</p>
          <CommentBox
            id="quote-comment"
            value={draft.body}
            onChange={(body) => setDraft({ ...draft, body })}
            placeholder="Your comment…"
            autoFocus
          />
          <div className="mt-3 flex items-center gap-6">
            <PrimaryButton loading={busy} onClick={() => add(draft.quote, draft.body, () => setDraft(null))} className="flex-1">
              Add comment
            </PrimaryButton>
            <button type="button" onClick={() => setDraft(null)} className="-my-3 py-3 text-slate-600 type-link pressed:underline focus-ring:underline">
              Cancel
            </button>
          </div>
        </section>
      )}

      <section aria-label="Your comment" className="mt-8 px-6">
        <TextField
          id="reviewer-name"
          label="Your name"
          value={name}
          maxLength={60}
          autoComplete="name"
          placeholder="Ms. Lee"
          onChange={(e) => setName(e.target.value)}
          error={nameError ?? undefined}
        />
        <CommentBox id="whole-comment" value={whole} onChange={setWhole} placeholder="Comment on the whole answer…" label="Comment on the whole answer" />
        {error && (
          <p role="alert" className="mt-2 text-coral-700 type-caption">
            {error}
          </p>
        )}
        <PrimaryButton loading={busy && !draft} onClick={() => add(null, whole, () => setWhole(""))} className="mt-4">
          Add comment
        </PrimaryButton>
        <p className="mt-3 text-slate-600 type-caption">
          By commenting you agree to Stackd&apos;s{" "}
          <a href="/terms/" className="text-blue-600 underline">
            Terms
          </a>
          . Keep it about the writing; abusive comments are removed.{" "}
          <a href="/privacy/" className="text-blue-600 underline">
            Privacy
          </a>
        </p>
      </section>

      {page.comments.length > 0 && (
        <section aria-labelledby="comments-title" className="mt-10 px-6">
          <h2 id="comments-title" className="text-navy-900 type-title-3">
            Comments ({page.comments.length})
          </h2>
          <ul className="mt-4 space-y-5">
            {page.comments.map((c) => (
              <li key={c.id} className={cn("rounded-sm", focused && c.quote === focused && "bg-tint-indigo -mx-2 px-2 py-2")}>
                {c.quote && <p className="border-l-2 border-indigo-600 pl-3 text-slate-600 type-caption">&ldquo;{c.quote}&rdquo;</p>}
                <p className={cn("whitespace-pre-wrap break-words text-navy-900 type-body", c.quote && "mt-1")}>{c.body}</p>
                <p className="mt-1 text-slate-600 type-caption">
                  {c.reviewer_name}, {shortDate(c.created_at)}
                  {c.can_delete && (
                    <>
                      {", "}
                      <button type="button" onClick={() => remove(c.id)} className="-my-3 py-3 text-coral-700 type-caption pressed:underline focus-ring:underline">
                        Delete
                      </button>
                    </>
                  )}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-10 max-w-[480px] px-6 text-slate-600 type-caption">
        Only people with this link can see this answer. It ends on {longDate(page.expires_at)}.
      </p>
    </>
  );
}

type CommentBoxProps = { id: string; value: string; onChange: (v: string) => void; placeholder: string; label?: string; autoFocus?: boolean };

function CommentBox({ id, value, onChange, placeholder, label, autoFocus }: CommentBoxProps) {
  return (
    <div className="mt-4">
      {label && (
        <label htmlFor={id} className="block text-navy-900 type-headline">
          {label}
        </label>
      )}
      <textarea
        id={id}
        value={value}
        maxLength={COMMENT_MAX}
        rows={3}
        autoFocus={autoFocus}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "block w-full resize-y rounded-sm border border-field-border bg-surface px-4 py-3 text-navy-900 caret-blue-600 outline-none type-body-md placeholder:text-slate-600",
          "field-focus:border-blue-600 field-focus:shadow-[inset_0_0_0_1px_var(--blue-600),0_0_0_4px_rgba(3,100,250,.15)]",
          label && "mt-2",
        )}
      />
      <p className="mt-1 text-right text-slate-600 tabular-nums type-caption">
        {value.length} / {COMMENT_MAX}
      </p>
    </div>
  );
}
