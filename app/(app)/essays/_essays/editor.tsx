"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowSquareOutIcon, CheckIcon, ClipboardTextIcon, DotsThreeIcon, FileArrowUpIcon } from "@phosphor-icons/react/ssr";
import { BackButton } from "@/components/back-button";
import { CircleButton } from "@/components/ui/circle-button";
import { Expand } from "@/components/ui/expand";
import { InlineError } from "@/components/ui/inline-error";
import { Loading } from "@/components/ui/loading";
import { TintedButton } from "@/components/ui/tinted-button";
import { Toast } from "@/components/ui/toast";
import { GoHome } from "@/components/unbuilt-route";
import { useTerm } from "@/lib/data/deadlines";
import { onDraftsReplaced, retryEssays, saveDraft, useEssays, useSaveState, type SaveState } from "@/lib/data/essays";
import { createReviewLink, useDraftReviews } from "@/lib/data/reviews";
import { cn } from "@/lib/cn";
import { counter, countWords, draftKey, type Prompt } from "@/lib/essays";
import { essaysHref } from "@/lib/features";
import { cleanImported, combineDraft, findQuote, reviewMessage } from "@/lib/review";
import { copyText, readClipboard, readDraftFile, shareText } from "@/lib/share";
import { ConfirmSheet } from "./confirm-sheet";
import { MoreSheet, type MoreAction } from "./more-sheet";
import { ReviewSheet } from "./review-sheet";
import { ReviewsSection } from "./reviews-section";

// Typing is saved this long after it stops, and at once on leaving (17 → Saving)
const SAVE_AFTER_MS = 800;

const SAVE_TEXT: Record<NonNullable<SaveState>, string> = { saving: "Saving…", saved: "Saved", offline: "Saved on this phone" };

// The editor exists only with Essays on; otherwise the address goes Home
export function EditorRoute() {
  if (!essaysHref()) return <GoHome />;
  return <EditorScreen />;
}

// The visible height, which shrinks when the keyboard opens, so the counter always sits above it
function useViewportHeight() {
  const [height, setHeight] = useState<number | null>(null);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setHeight(vv.height);
    update();
    vv.addEventListener("resize", update);
    return () => vv.removeEventListener("resize", update);
  }, []);
  return height;
}

function EditorScreen() {
  const router = useRouter();
  const q = useSearchParams().get("q");
  const { term } = useTerm();
  const state = useEssays(term);
  const prompt = state.status === "ok" ? state.prompts.find((p) => p.key === q) : undefined;

  // A question that isn't there (an old link, a typo) goes back to the list
  const missing = state.status === "ok" && !prompt;
  useEffect(() => {
    const list = essaysHref();
    if (missing && list) router.replace(list);
  }, [missing, router]);

  if (state.status === "loading") {
    return (
      <div className="min-h-dvh bg-surface pt-32">
        <Loading label="Loading your answer" />
      </div>
    );
  }
  if (state.status === "error") {
    return (
      <div className="min-h-dvh bg-surface px-4" style={{ paddingTop: "calc(var(--safe-top) + 8px)" }}>
        <BackButton fallback={essaysHref() ?? "/"} slideBack />
        <div className="mt-6">
          <InlineError
            title="Couldn't load your answer"
            body="Check your connection, then try again."
            action={<TintedButton onClick={retryEssays}>Try again</TintedButton>}
          />
        </div>
      </div>
    );
  }
  if (!prompt) return null;
  return <Editor key={prompt.key} prompt={prompt} saved={state.drafts[draftKey(prompt.cycle, prompt.key)]} />;
}

type EditorProps = { prompt: Prompt; saved: { body: string; done_at: string | null } | undefined };

// Text waiting for the student to say Replace or Add to the end (19 → Bring a draft in)
type Incoming = { text: string; open: boolean };

// The writing screen (17 → Editor): save state, the overflow menu and Mark done on top, the question in a light strip,
// the answer as plain text, the Reviews section under it (19), and the word count above the bottom edge.
function Editor({ prompt, saved }: EditorProps) {
  const key = draftKey(prompt.cycle, prompt.key);
  const [text, setText] = useState(saved?.body ?? "");
  const [typing, setTyping] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [toast, setToast] = useState<{ key: number; text: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [incoming, setIncoming] = useState<Incoming | null>(null);
  const [bringError, setBringError] = useState<string | null>(null);
  const [review, setReview] = useState<{ open: boolean; busy: boolean; error: string | null }>({ open: false, busy: false, error: null });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Typed but not saved yet
  const pending = useRef<string | null>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const saveState = useSaveState(key, typing);
  const links = useDraftReviews(key);
  const height = useViewportHeight();
  const count = counter(countWords(text));
  const done = Boolean(saved?.done_at);
  const empty = !text.trim();

  const say = (message: string) => setToast((t) => ({ key: (t?.key ?? 0) + 1, text: message }));

  // The saved text changed underneath (the account's copy arrived, or another device's newer save): show it, unless
  // the student is in the middle of typing, whose words are newer and get saved next
  const savedBody = saved?.body ?? "";
  const [shown, setShown] = useState(savedBody);
  if (savedBody !== shown) {
    setShown(savedBody);
    if (!typing) setText(savedBody);
  }

  // Saves what's typed now. Also runs on leaving the screen and when the app goes to the background.
  const commitRef = useRef(() => {});
  useEffect(() => {
    commitRef.current = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      if (pending.current !== null) saveDraft(prompt.cycle, prompt.key, { body: pending.current });
      pending.current = null;
      setTyping(false);
    };
  });

  useEffect(() => {
    const commit = () => commitRef.current();
    const onHide = () => {
      if (document.visibilityState === "hidden") commit();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", commit);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", commit);
      commit();
    };
  }, []);

  // A newer save from another device replaced this draft (17 → Saving). Unsaved typing gives way to it.
  useEffect(
    () =>
      onDraftsReplaced((keys) => {
        if (!keys.includes(key)) return;
        if (timer.current) clearTimeout(timer.current);
        timer.current = null;
        pending.current = null;
        setTyping(false);
        say("Updated from your other device.");
      }),
    [key],
  );

  // The field grows with its text, so the Reviews section sits under the answer and the page scrolls as one
  useLayoutEffect(() => {
    const el = field.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [text, height, links.length]);

  function onType(value: string) {
    setText(value);
    setCollapsed(true);
    setTyping(true);
    setBringError(null);
    pending.current = value;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => commitRef.current(), SAVE_AFTER_MS);
  }

  function toggleDone() {
    commitRef.current();
    saveDraft(prompt.cycle, prompt.key, { done_at: done ? null : new Date().toISOString() });
  }

  // Puts brought-in text in the answer and saves it at once (19 → Bring a draft in)
  function applyIncoming(value: string, mode: "replace" | "append") {
    commitRef.current();
    const next = combineDraft(text, value, mode);
    setText(next);
    setIncoming((i) => (i ? { ...i, open: false } : i));
    setBringError(null);
    saveDraft(prompt.cycle, prompt.key, { body: next });
    say(`Draft added, ${countWords(value)} ${countWords(value) === 1 ? "word" : "words"}.`);
  }

  // An empty answer takes the text straight away; one with words asks first. Errors show under the buttons when the
  // answer is empty, and as a toast from the menu.
  function bringIn(raw: string | null, error: string) {
    const cleaned = raw === null ? "" : cleanImported(raw);
    if (!cleaned) {
      if (empty) setBringError(error);
      else say(error);
      return;
    }
    if (empty) applyIncoming(cleaned, "replace");
    else setIncoming({ text: cleaned, open: true });
  }

  async function paste() {
    const clip = await readClipboard();
    bringIn(clip, clip === null ? "Stackd couldn't read the clipboard. Try again and tap Allow Paste." : "Nothing to paste. Copy your draft first.");
  }

  async function onFile(file: File | undefined) {
    if (fileInput.current) fileInput.current.value = "";
    if (!file) return;
    bringIn(await readDraftFile(file), "Couldn't read that file. Try copying the text and using Paste a draft.");
  }

  async function onAction(action: MoreAction) {
    setMenuOpen(false);
    commitRef.current();
    if (action === "copy") return say((await copyText(text)) ? "Copied. Paste it into UC's application." : "Couldn't copy. Select the text and copy it instead.");
    if (action === "share") {
      const outcome = await shareText(`${prompt.short_name}: personal insight answer`, text);
      if (outcome === "copied") say("Copied. Paste it into UC's application.");
      if (outcome === "failed") say("Couldn't open sharing. Try Copy text instead.");
      return;
    }
    if (action === "review") return setReview({ open: true, busy: false, error: null });
    if (action === "paste") return paste();
    fileInput.current?.click();
  }

  async function createLink(reviewer: string) {
    commitRef.current();
    setReview((r) => ({ ...r, busy: true, error: null }));
    const result = await createReviewLink(prompt.cycle, prompt.key, reviewer);
    if (!result.ok) {
      setReview((r) => ({
        ...r,
        busy: false,
        error: result.reason === "offline" ? "You're offline. Connect, then try again." : "Couldn't create the link. Try again in a minute.",
      }));
      return;
    }
    setReview({ open: false, busy: false, error: null });
    const outcome = await shareText("Review my answer", reviewMessage(result.url));
    say(outcome === "copied" ? "Link created and copied." : "Link created.");
  }

  // Tapping a comment's quote selects that phrase in the answer (19 → Comments)
  function selectQuote(quote: string) {
    const el = field.current;
    const at = findQuote(text, quote);
    if (!el || !at) return;
    el.focus({ preventScroll: true });
    el.setSelectionRange(at.start, at.end);
    const box = scroller.current;
    if (box) box.scrollTo({ top: Math.max(0, el.offsetTop + (at.start / Math.max(text.length, 1)) * el.scrollHeight - 96) });
  }

  return (
    <div className="fixed inset-x-0 top-0 flex flex-col bg-surface" style={{ height: height ?? "100dvh" }}>
      {/* The light strip (17 → Editor): a writing screen, not a progress screen, so no solid panel */}
      <div className="bg-tint-indigo">
        <div className="mx-auto max-w-[480px] pb-4" style={{ paddingTop: "calc(var(--safe-top) + 8px)" }}>
          {/* Equal side columns keep the save state centered between Back and the two buttons on the right */}
          <div className="grid grid-cols-[96px_1fr_96px] items-center gap-2 px-4">
            <BackButton fallback={essaysHref() ?? "/"} slideBack />
            <p aria-live="polite" className="text-center text-slate-600 type-caption">
              {saveState ? SAVE_TEXT[saveState] : ""}
            </p>
            <div className="flex justify-end gap-2">
              {/* The overflow menu (19): copy, share, ask for review, then paste and import */}
              <CircleButton aria-label="More" aria-haspopup="dialog" icon={<DotsThreeIcon weight="bold" size={22} aria-hidden />} onClick={() => setMenuOpen(true)} />
              <CircleButton
                aria-label="Mark done"
                aria-pressed={done}
                icon={<CheckIcon weight="bold" size={22} aria-hidden />}
                onClick={toggleDone}
                variant={done ? "done" : "surface"}
              />
            </div>
          </div>
          <div className="mt-3 px-6">
            {collapsed ? (
              // One line once the student is writing; tapping it shows the question again
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                aria-expanded={false}
                aria-label={`${prompt.short_name}, show the question`}
                className="block w-full truncate text-left text-navy-900 type-title-2"
              >
                {prompt.short_name}
              </button>
            ) : (
              <h1 className="text-navy-900 type-title-2">{prompt.short_name}</h1>
            )}
            <Expand open={!collapsed}>
              <p className="mt-1 text-slate-700 type-body">{prompt.summary}</p>
              <div className="mt-2">
                <a
                  href={prompt.source_url}
                  target="_blank"
                  rel="noopener"
                  aria-label="Read UC's exact wording, opens outside the app"
                  className="-my-[13px] inline-flex items-center gap-1.5 py-[13px] text-blue-700 type-label pressed:underline focus-ring:underline"
                >
                  <ArrowSquareOutIcon weight="bold" size={16} aria-hidden />
                  Read UC&apos;s exact wording
                </a>
              </div>
            </Expand>
          </div>
        </div>
      </div>

      <div className="mx-auto flex min-h-0 w-full max-w-[480px] flex-1 flex-col">
        <div
          ref={scroller}
          className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain"
          onScroll={(e) => {
            // Scrolling back to the top shows the question again
            if (e.currentTarget.scrollTop === 0) setCollapsed(false);
          }}
        >
          <textarea
            ref={field}
            value={text}
            onChange={(e) => onType(e.target.value)}
            onBlur={() => commitRef.current()}
            placeholder="Start writing. It saves as you go."
            autoCapitalize="sentences"
            spellCheck
            aria-label={`Your answer: ${prompt.short_name}`}
            aria-describedby="word-count"
            className={cn(
              "block w-full resize-none overflow-hidden bg-transparent px-6 py-4 text-navy-900 type-body-lg placeholder:text-slate-600 focus:outline-none",
              links.length ? "min-h-[50%]" : "min-h-full",
            )}
          />
          {empty && (
            // 16 under the placeholder's line (19 → Bring a draft in)
            <div className="absolute left-6 right-6 top-[56px]">
              <div className="flex gap-6">
                <button type="button" onClick={paste} className="-my-3 inline-flex items-center gap-1.5 py-3 text-blue-600 type-label pressed:underline focus-ring:underline">
                  <ClipboardTextIcon weight="bold" size={18} aria-hidden />
                  Paste a draft
                </button>
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="-my-3 inline-flex items-center gap-1.5 py-3 text-blue-600 type-label pressed:underline focus-ring:underline"
                >
                  <FileArrowUpIcon weight="bold" size={18} aria-hidden />
                  Import a file
                </button>
              </div>
              {bringError && (
                <p role="alert" className="mt-4 max-w-[320px] text-coral-700 type-caption">
                  {bringError}
                </p>
              )}
            </div>
          )}
          {links.length > 0 && (
            <div className="pb-6">
              <ReviewsSection links={links} text={text} onSelectQuote={selectQuote} onToast={say} />
            </div>
          )}
        </div>
        <p
          id="word-count"
          className={cn(
            "px-6 pt-2 text-right tabular-nums type-label",
            count.tone === "over" ? "text-coral-700" : count.tone === "near" ? "text-amber-700" : "text-slate-600",
          )}
          style={{ paddingBottom: "calc(var(--safe-bottom) + 12px)" }}
        >
          {count.text}
        </p>
        {/* "Get feedback" goes here in part 3, behind essayFeedback */}
      </div>

      <input ref={fileInput} type="file" accept=".docx,.txt,.md,text/plain,text/markdown" hidden onChange={(e) => onFile(e.target.files?.[0])} />

      <MoreSheet open={menuOpen} title={prompt.short_name} hasText={!empty} onAction={onAction} onClose={() => setMenuOpen(false)} />

      <ConfirmSheet
        open={Boolean(incoming?.open)}
        id="replace-title"
        title="Replace this draft?"
        body={`Your current ${countWords(text)} ${countWords(text) === 1 ? "word" : "words"} will be replaced.`}
        confirm="Replace"
        onConfirm={() => incoming && applyIncoming(incoming.text, "replace")}
        alternative={{ label: "Add to the end", onClick: () => incoming && applyIncoming(incoming.text, "append") }}
        onClose={() => setIncoming((i) => (i ? { ...i, open: false } : i))}
      />

      <ReviewSheet
        open={review.open}
        busy={review.busy}
        error={review.error}
        onCreate={createLink}
        onClose={() => setReview((r) => ({ ...r, open: false }))}
      />

      {toast && <Toast key={toast.key} message={toast.text} bottom="calc(var(--safe-bottom) + 48px)" onDone={() => setToast(null)} overSheet />}
    </div>
  );
}
