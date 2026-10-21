"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowSquareOutIcon, CheckIcon, DotsThreeIcon } from "@phosphor-icons/react/ssr";
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
import { cn } from "@/lib/cn";
import { counter, countWords, draftKey, type Prompt } from "@/lib/essays";
import { essaysHref } from "@/lib/features";

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

// The writing screen (17 → Editor): save state and Mark done on top, the question in a light strip, the answer as
// plain text, and the word count above the bottom edge.
function Editor({ prompt, saved }: EditorProps) {
  const key = draftKey(prompt.cycle, prompt.key);
  const [text, setText] = useState(saved?.body ?? "");
  const [typing, setTyping] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [toast, setToast] = useState<{ key: number; text: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Typed but not saved yet
  const pending = useRef<string | null>(null);
  const saveState = useSaveState(key, typing);
  const height = useViewportHeight();
  const count = counter(countWords(text));
  const done = Boolean(saved?.done_at);

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
        setToast((t) => ({ key: (t?.key ?? 0) + 1, text: "Updated from your other device." }));
      }),
    [key],
  );

  function onType(value: string) {
    setText(value);
    setCollapsed(true);
    setTyping(true);
    pending.current = value;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => commitRef.current(), SAVE_AFTER_MS);
  }

  function toggleDone() {
    commitRef.current();
    saveDraft(prompt.cycle, prompt.key, { done_at: done ? null : new Date().toISOString() });
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
              {/* The overflow menu, empty until 19 fills it (copy, share, review, import). Disabled meanwhile, so
                  it's never a button that does nothing. */}
              <CircleButton
                aria-label="More"
                aria-disabled="true"
                disabled
                icon={<DotsThreeIcon weight="bold" size={22} aria-hidden />}
                className="opacity-40"
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
        </div>
      </div>

      <div className="mx-auto flex min-h-0 w-full max-w-[480px] flex-1 flex-col">
        <textarea
          value={text}
          onChange={(e) => onType(e.target.value)}
          onScroll={(e) => {
            // Scrolling back to the top shows the question again
            if (e.currentTarget.scrollTop === 0) setCollapsed(false);
          }}
          onBlur={() => commitRef.current()}
          placeholder="Start writing. It saves as you go."
          autoCapitalize="sentences"
          spellCheck
          aria-label={`Your answer: ${prompt.short_name}`}
          aria-describedby="word-count"
          className="min-h-0 flex-1 resize-none bg-transparent px-6 py-4 text-navy-900 type-body-lg placeholder:text-slate-600 focus:outline-none"
        />
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

      {toast && <Toast key={toast.key} message={toast.text} bottom="calc(var(--safe-bottom) + 48px)" onDone={() => setToast(null)} />}
    </div>
  );
}
