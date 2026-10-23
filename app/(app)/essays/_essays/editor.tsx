"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type FocusEvent } from "react";
import { useReducedMotion } from "motion/react";
import { ArrowSquareOutIcon, CheckIcon, ClipboardTextIcon, DotsThreeIcon, FileArrowUpIcon } from "@phosphor-icons/react/ssr";
import { BackButton } from "@/components/back-button";
import { CircleButton } from "@/components/ui/circle-button";
import { Expand } from "@/components/ui/expand";
import { InlineError } from "@/components/ui/inline-error";
import { Loading } from "@/components/ui/loading";
import { TintedButton } from "@/components/ui/tinted-button";
import { Toast } from "@/components/ui/toast";
import { UnderlineTabs } from "@/components/ui/underline-tabs";
import { GoHome } from "@/components/unbuilt-route";
import { useTerm } from "@/lib/data/deadlines";
import { onDraftsReplaced, retryEssays, saveDraft, useEssays, useSaveState, type SaveState } from "@/lib/data/essays";
import { createReviewLink, useDraftReviews } from "@/lib/data/reviews";
import { cn } from "@/lib/cn";
import { counter, countWords, draftKey, draftNotes, type Draft, type Prompt } from "@/lib/essays";
import { essaysHref } from "@/lib/features";
import { addToAnswer, canAddNote, makeNote, nextStarter, removeNote, restoreNote, sameNotes, starterIds, type Note } from "@/lib/notes";
import { startersFor } from "@/lib/piq-starters";
import { cleanImported, combineDraft, commentNames, draftHighlights, findQuote, insideSpan, reviewMessage } from "@/lib/review";
import { copyText, readClipboard, readDraftFile, shareText } from "@/lib/share";
import { CommentBar } from "./comment-bar";
import { ConfirmSheet } from "./confirm-sheet";
import { DraftMirror, FIELD_TEXT } from "./draft-mirror";
import { hasMoreItems, MoreSheet, type MoreAction } from "./more-sheet";
import { NoteMenu } from "./note-menu";
import { NotesTab } from "./notes-tab";
import { ReviewSheet } from "./review-sheet";
import { ReviewsSection } from "./reviews-section";
import { StarterCard } from "./starter-card";
import { StartersSheet } from "./starters-sheet";

// Typing is saved this long after it stops, and at once on leaving (17 → Saving)
const SAVE_AFTER_MS = 800;

const SAVE_TEXT: Record<NonNullable<SaveState>, string> = { saving: "Saving…", saved: "Saved", offline: "Saved on this phone" };

// How long See comment tints the comment in Reviews (20 → Comment bar)
const FLASH_MS = 1200;
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

type EditorProps = { prompt: Prompt; saved: Draft | undefined };

// Text waiting for the student to say Replace or Add to the end (19 → Bring a draft in)
type Incoming = { text: string; open: boolean };

type Tab = "answer" | "notes";

// The writing screen (17 → Editor): save state, the overflow menu and Mark done on top, the question in a light strip,
// the answer as plain text, the Reviews section under it (19), and the word count above the bottom edge.
function Editor({ prompt, saved }: EditorProps) {
  const key = draftKey(prompt.cycle, prompt.key);
  const [text, setText] = useState(saved?.body ?? "");
  const [typing, setTyping] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [toast, setToast] = useState<{ key: number; text: string; action?: { label: string; onClick: () => void } } | null>(null);
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
  const mirror = useRef<HTMLDivElement>(null);
  const saveState = useSaveState(key, typing);
  const links = useDraftReviews(key);
  const height = useViewportHeight();
  const reduceMotion = useReducedMotion();

  // The caret or selection in the answer while it has focus, for the comment bar (20 → Comment bar). Typing hides
  // the bar until the caret is somewhere typing didn't put it.
  const [caret, setCaret] = useState<{ start: number; end: number } | null>(null);
  const [quiet, setQuiet] = useState(false);
  const typedAt = useRef<number | null>(null);
  // A press on the bar has started, so the field losing focus shouldn't hide it
  const pressingBar = useRef(false);
  // The comment See comment tinted in Reviews
  const [flash, setFlash] = useState<string | null>(null);

  // Answer and Notes (20 → 1, 3). Notes save like the answer: 800 ms after typing stops, and on leaving.
  const [tab, setTab] = useState<Tab>("answer");
  const [notes, setNotes] = useState<Note[]>(() => draftNotes(saved));
  const pendingNotes = useRef<Note[] | null>(null);
  // The notes as they are now, for Undo, which runs from a toast made earlier
  const notesNow = useRef(notes);
  useEffect(() => {
    notesNow.current = notes;
  }, [notes]);
  const [focusNote, setFocusNote] = useState<string | null>(null);
  const clearFocusNote = useCallback(() => setFocusNote(null), []);
  const [noteMenu, setNoteMenu] = useState<{ note: Note; open: boolean } | null>(null);
  const [startersOpen, setStartersOpen] = useState(false);
  // Each tab keeps its own scroll position
  const tabScroll = useRef<Record<Tab, number>>({ answer: 0, notes: 0 });

  // The starter card (20 → 2): hidden while the answer field (or the Paste and Import buttons under it) has focus
  const starters = useMemo(() => startersFor(prompt.key), [prompt.key]);
  const [cardFrom, setCardFrom] = useState(0);
  const [calm, setCalm] = useState(false);
  const bringInBox = useRef<HTMLDivElement>(null);
  const pressingBringIn = useRef(false);

  const highlights = useMemo(() => draftHighlights(text, links), [text, links]);
  const here = caret && !quiet ? highlights.filter((h) => insideSpan(h, caret.start, caret.end)) : [];
  const newest = here.reduce<(typeof here)[number] | null>((n, h) => (!n || h.comment.created_at > n.comment.created_at ? h : n), null);
  const count = counter(countWords(text));
  const done = Boolean(saved?.done_at);
  const empty = !text.trim();
  const menuItems = hasMoreItems(!empty);
  const card = nextStarter(starters, notes, cardFrom);
  const showStart = tab === "answer" && empty && !calm && starters.length > 0;

  const say = (message: string, action?: { label: string; onClick: () => void }) =>
    setToast((t) => ({ key: (t?.key ?? 0) + 1, text: message, action }));

  // The saved text changed underneath (the account's copy arrived, or another device's newer save): show it, unless
  // the student is in the middle of typing, whose words are newer and get saved next. Notes the same way.
  const savedBody = saved?.body ?? "";
  const [shown, setShown] = useState(savedBody);
  if (savedBody !== shown) {
    setShown(savedBody);
    if (!typing) setText(savedBody);
  }
  const savedNotes = draftNotes(saved);
  const [shownNotes, setShownNotes] = useState(savedNotes);
  if (!sameNotes(savedNotes, shownNotes)) {
    setShownNotes(savedNotes);
    if (!typing) setNotes(savedNotes);
  }

  // Saves what's typed now, answer and notes together. Also runs on leaving the screen and when the app goes to the
  // background.
  const commitRef = useRef(() => {});
  useEffect(() => {
    commitRef.current = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      if (pending.current !== null || pendingNotes.current !== null) {
        saveDraft(prompt.cycle, prompt.key, {
          ...(pending.current !== null && { body: pending.current }),
          ...(pendingNotes.current !== null && { notes: pendingNotes.current }),
        });
      }
      pending.current = null;
      pendingNotes.current = null;
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
        pendingNotes.current = null;
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

  // The bar takes room from the bottom of the writing area; if that covers the phrase, scroll it back into view
  const barShown = Boolean(newest);
  useLayoutEffect(() => {
    const box = scroller.current;
    if (!barShown || !box || !newest) return;
    const mark = [...(mirror.current?.querySelectorAll<HTMLElement>("mark[data-start]") ?? [])].find((m) => {
      const start = Number(m.dataset.start);
      return start < newest.end && start + (m.textContent?.length ?? 0) > newest.start;
    });
    if (!mark) return;
    const covered = mark.getBoundingClientRect().bottom + 8 - box.getBoundingClientRect().bottom;
    if (covered > 0) box.scrollTop += covered;
    // Only when the bar opens, not on every caret move inside it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barShown]);

  // The tint from See comment fades after 1.2 s; under reduced motion it stays until the next tap
  useEffect(() => {
    if (!flash) return;
    if (!reduceMotion) {
      const t = setTimeout(() => setFlash(null), FLASH_MS);
      return () => clearTimeout(t);
    }
    const clear = () => setFlash(null);
    document.addEventListener("pointerdown", clear, { once: true });
    return () => document.removeEventListener("pointerdown", clear);
  }, [flash, reduceMotion]);

  // Follows the caret, including selections made from code (tapping a quote in Reviews)
  useEffect(() => {
    function read() {
      const el = field.current;
      if (!el || document.activeElement !== el) return;
      const { selectionStart: start, selectionEnd: end } = el;
      if (!(start === end && start === typedAt.current)) {
        typedAt.current = null;
        setQuiet(false);
      }
      setCaret((c) => (c && c.start === start && c.end === end ? c : { start, end }));
    }
    const el = field.current;
    document.addEventListener("selectionchange", read);
    el?.addEventListener("selectionchange", read);
    el?.addEventListener("focus", read);
    return () => {
      document.removeEventListener("selectionchange", read);
      el?.removeEventListener("selectionchange", read);
      el?.removeEventListener("focus", read);
    };
  }, []);

  // See comment: closes the keyboard, scrolls Reviews to the newest comment on the phrase and tints it
  function seeComment() {
    if (!newest) return;
    const id = newest.comment.id;
    pressingBar.current = false;
    setCaret(null);
    field.current?.blur();
    setFlash(id);
    document.getElementById(`comment-${id}`)?.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
  }

  function onType(value: string) {
    setText(value);
    setQuiet(true);
    setCollapsed(true);
    setTyping(true);
    setBringError(null);
    pending.current = value;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => commitRef.current(), SAVE_AFTER_MS);
  }

  // Notes change: typing waits for the 800 ms pause like the answer; adding and deleting save at once
  function changeNotes(next: Note[], typed: boolean) {
    setNotes(next);
    pendingNotes.current = next;
    if (!typed) return commitRef.current();
    setCollapsed(true);
    setTyping(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => commitRef.current(), SAVE_AFTER_MS);
  }

  function switchTab(next: Tab) {
    if (next === tab) return;
    const box = scroller.current;
    if (box) tabScroll.current[tab] = box.scrollTop;
    setTab(next);
    requestAnimationFrame(() => {
      if (scroller.current) scroller.current.scrollTop = tabScroll.current[next];
    });
  }

  // Adds a note (a starter question, or your own with null), shows Notes and puts the cursor in it
  function addNote(starter: string | null) {
    if (!canAddNote(notes)) return;
    const note = makeNote(starter);
    changeNotes([...notes, note], false);
    setFocusNote(note.id);
    switchTab("notes");
  }

  function noteToAnswer() {
    const note = noteMenu?.note;
    setNoteMenu((m) => (m ? { ...m, open: false } : m));
    if (!note?.body.trim()) return;
    commitRef.current();
    const next = addToAnswer(text, note.body);
    setText(next);
    saveDraft(prompt.cycle, prompt.key, { body: next });
    switchTab("answer");
    say("Added to your answer.");
  }

  function deleteNote() {
    const note = noteMenu?.note;
    setNoteMenu((m) => (m ? { ...m, open: false } : m));
    if (!note) return;
    commitRef.current();
    const { notes: next, removed } = removeNote(notes, note.id);
    if (!removed) return;
    changeNotes(next, false);
    say("Note deleted.", {
      label: "Undo",
      onClick: () => {
        setToast(null);
        commitRef.current();
        changeNotes(restoreNote(notesNow.current, removed), false);
      },
    });
  }

  // Focus left the answer field. Pressing Paste or Import under it keeps the card hidden, so they don't move under
  // the finger; the next press anywhere else brings the card back.
  function onFieldBlur(e: FocusEvent<HTMLTextAreaElement>) {
    const toBringIn = pressingBringIn.current || Boolean(e.relatedTarget && bringInBox.current?.contains(e.relatedTarget as Node));
    pressingBringIn.current = false;
    if (!toBringIn) return setCalm(false);
    document.addEventListener(
      "pointerdown",
      (ev) => {
        const target = ev.target as Node | null;
        if (!bringInBox.current?.contains(target) && target !== field.current) setCalm(false);
      },
      { once: true },
    );
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
        <div className="mx-auto max-w-[480px]" style={{ paddingTop: "calc(var(--safe-top) + 8px)" }}>
          {/* Equal side columns keep the save state centered between Back and the two buttons on the right */}
          <div className="grid grid-cols-[96px_1fr_96px] items-center gap-2 px-4">
            <BackButton fallback={essaysHref() ?? "/"} slideBack />
            <p aria-live="polite" className="text-center text-slate-600 type-caption">
              {saveState ? SAVE_TEXT[saveState] : ""}
            </p>
            <div className="flex justify-end gap-2">
              {/* The overflow menu (19): copy, share, ask for review, then paste and import. Enabled only while it
                  has something to use; otherwise dimmed and disabled, as before 19 filled it. */}
              <CircleButton
                aria-label="More"
                aria-haspopup="dialog"
                disabled={!menuItems}
                aria-disabled={!menuItems || undefined}
                icon={<DotsThreeIcon weight="bold" size={22} aria-hidden />}
                onClick={() => setMenuOpen(true)}
                className={cn(!menuItems && "opacity-40")}
              />
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
          {/* Answer and Notes (20 → 1), still on the strip and kept when it collapses. The first label lines up with
              the strip's text at 24. */}
          <UnderlineTabs
            aria-label="Answer or notes"
            fit
            className="mt-2 px-[10px]"
            tabs={[
              { id: "answer", label: "Answer" },
              { id: "notes", label: notes.length ? `Notes (${notes.length})` : "Notes" },
            ]}
            value={tab}
            onChange={(id) => switchTab(id as Tab)}
          />
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
          {tab === "answer" && <DraftMirror ref={mirror} text={text} marks={highlights} />}
          {/* Stays mounted on the Notes tab (hidden), so its caret listeners and size keep working */}
          <textarea
            ref={field}
            value={text}
            onChange={(e) => {
              typedAt.current = e.target.selectionEnd;
              onType(e.target.value);
            }}
            onFocus={() => setCalm(true)}
            onBlur={(e) => {
              onFieldBlur(e);
              commitRef.current();
              if (!pressingBar.current) setCaret(null);
              else {
                // Focus left for the bar: the next press anywhere else, with the field still unfocused, hides it
                document.addEventListener(
                  "pointerdown",
                  (e) => {
                    if (!(e.target as Element | null)?.closest("[data-comment-bar]") && document.activeElement !== field.current) setCaret(null);
                  },
                  { once: true },
                );
              }
              pressingBar.current = false;
            }}
            onScroll={(e) => {
              // The field grows to fit, so this shouldn't happen; if the browser scrolls it anyway, the mirror follows
              if (mirror.current) mirror.current.style.transform = `translateY(${-e.currentTarget.scrollTop}px)`;
            }}
            placeholder="Start writing. It saves as you go."
            autoCapitalize="sentences"
            spellCheck
            aria-label={`Your answer: ${prompt.short_name}`}
            aria-describedby="word-count"
            className={cn(
              "relative block w-full resize-none appearance-none overflow-hidden bg-transparent text-navy-900 placeholder:text-slate-600 focus:outline-none",
              FIELD_TEXT,
              links.length ? "min-h-[50%]" : "min-h-full",
              tab !== "answer" && "hidden",
            )}
          />
          {tab === "answer" && empty && (
            // 16 under the placeholder's line, inset 16 for the card and 24 for text (20 → 2, 19 → Bring a draft in)
            <div className="absolute inset-x-4 top-[56px] pb-6">
              {showStart &&
                (card !== null ? (
                  <StarterCard
                    starter={starters[card]}
                    total={starters.length}
                    onTryAnother={() => setCardFrom(card + 1)}
                    onAnswer={() => addNote(starters[card].id)}
                  />
                ) : (
                  <p className="px-2 text-slate-700 type-body">
                    Your notes are ready. Start your answer above, or use Add to my answer on a note.
                  </p>
                ))}
              <div
                ref={bringInBox}
                onPointerDown={() => {
                  pressingBringIn.current = true;
                }}
                onBlur={(e) => {
                  // Keyboard focus moving on past Paste and Import brings the card back
                  const to = e.relatedTarget as Node | null;
                  if (!bringInBox.current?.contains(to) && to !== field.current) setCalm(false);
                }}
                className={cn("px-2", showStart && "mt-6")}
              >
                {showStart && <h2 className="mb-3 text-navy-900 type-headline">Already have a draft?</h2>}
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
            </div>
          )}
          {tab === "answer" && links.length > 0 && (
            <div className="pb-6">
              <ReviewsSection links={links} text={text} flash={flash} onSelectQuote={selectQuote} onToast={say} />
            </div>
          )}
          {tab === "notes" && (
            <div role="tabpanel" aria-label="Notes">
              <NotesTab
                notes={notes}
                focusId={focusNote}
                onFocused={clearFocusNote}
                onType={(id, body) => changeNotes(notes.map((n) => (n.id === id ? { ...n, body } : n)), true)}
                onMenu={(note) => setNoteMenu({ note, open: true })}
                onAddStarter={() => setStartersOpen(true)}
                onAddOwn={() => addNote(null)}
              />
            </div>
          )}
        </div>
        {tab === "answer" && newest && (
          <CommentBar
            name={commentNames(newest.comment.reviewer_name, here.length)}
            body={newest.comment.body}
            onSeeComment={seeComment}
            onPress={() => {
              pressingBar.current = true;
            }}
          />
        )}
        {/* Notes have no limit to count against, so the counter shows on the Answer tab only */}
        <p
          id="word-count"
          hidden={tab !== "answer"}
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

      <NoteMenu
        open={Boolean(noteMenu?.open)}
        note={noteMenu?.note ?? null}
        onAddToAnswer={noteToAnswer}
        onDelete={deleteNote}
        onClose={() => setNoteMenu((m) => (m ? { ...m, open: false } : m))}
      />

      <StartersSheet
        open={startersOpen}
        starters={starters}
        used={starterIds(notes)}
        onPick={(id) => {
          setStartersOpen(false);
          addNote(id);
        }}
        onClose={() => setStartersOpen(false)}
      />

      <ReviewSheet
        open={review.open}
        busy={review.busy}
        error={review.error}
        onCreate={createLink}
        onClose={() => setReview((r) => ({ ...r, open: false }))}
      />

      {toast && <Toast key={toast.key} message={toast.text} action={toast.action} bottom="calc(var(--safe-bottom) + 48px)" onDone={() => setToast(null)} overSheet />}
    </div>
  );
}
