"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BackButton } from "@/components/back-button";
import { InlineError } from "@/components/ui/inline-error";
import { LinkLine } from "@/components/ui/link-line";
import { Loading } from "@/components/ui/loading";
import { TintedButton } from "@/components/ui/tinted-button";
import { Toast } from "@/components/ui/toast";
import { UnofficialFooter } from "@/components/ui/unofficial-footer";
import { GoHome } from "@/components/unbuilt-route";
import { useDeadlines, useScope, useTerm } from "@/lib/data/deadlines";
import { retryEssays, saveDraft, useEssays } from "@/lib/data/essays";
import { cn } from "@/lib/cn";
import { checkedDate, cycleLabel, shortDate } from "@/lib/deadlines";
import { ANSWERS, CHOOSE, choose, chosenKeys, draftKey, progress, splitPrompts, WORD_LIMIT, type Prompt, type Segment } from "@/lib/essays";
import { essaysHref } from "@/lib/features";
import { QuestionRow } from "./question-row";
import { RemoveSheet } from "./remove-sheet";

const TOAST_BOTTOM = "calc(var(--safe-bottom) + 12px)";

// The Essays screen exists only with its flag on; otherwise the address goes Home (13: no dead ends)
export function EssaysRoute() {
  if (!essaysHref()) return <GoHome />;
  return <EssaysScreen />;
}

// The 4-segment bar on the indigo panel: done white, drafting 60% white, empty 25% white (17 → Essays screen)
function PanelBar({ segments }: { segments: Segment[] }) {
  return (
    <div aria-hidden className="mx-6 mt-3 flex gap-1">
      {segments.map((s, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 flex-1 rounded-full transition-colors duration-200 ease-out motion-reduce:transition-none",
            s === "done" ? "bg-white" : s === "drafting" ? "bg-white/60" : "bg-white/25",
          )}
        />
      ))}
    </div>
  );
}

// "Questions summarized from UC Admissions, checked Oct 19, 2026."
function sourceLine(prompts: Prompt[]) {
  const name = prompts[0]?.source_name ?? "UC Admissions";
  const checked = prompts.map((p) => p.verified_at).filter((v): v is string => Boolean(v)).sort()[0];
  return checked ? `Questions summarized from ${name}, checked ${checkedDate(checked)}.` : `Questions summarized from ${name}.`;
}

function EssaysScreen() {
  const router = useRouter();
  const { term } = useTerm();
  const scopeState = useScope();
  const deadlines = useDeadlines(scopeState);
  const state = useEssays(term);
  const [toast, setToast] = useState<{ key: number; text: string } | null>(null);
  const [removing, setRemoving] = useState<{ prompt: Prompt; open: boolean } | null>(null);

  const ok = state.status === "ok" ? state : null;
  const { required, optional } = ok ? splitPrompts(ok.prompts) : { required: [], optional: [] };
  const { done, segments } = ok ? progress(ok.prompts, ok.drafts) : { done: 0, segments: Array<Segment>(ANSWERS).fill("empty") };
  const chosen = ok ? chosenKeys(optional, ok.drafts).length : 0;

  // No UC in the plan: the answers are still here, with a word on who they're for (17 → States)
  const scope = scopeState.status === "ok" ? scopeState.scope : undefined;
  const noUc = Boolean(scope && !scope.some((s) => s.system === undefined || s.system?.toLowerCase() === "uc"));
  // After the UC application's due date for these questions' cycle (17 → States)
  const ucApplication =
    deadlines.status === "ok" && ok?.cycle
      ? [...deadlines.view.upcoming, ...deadlines.view.finished].find((d) => d.audience === "uc" && d.kind === "application" && d.cycle === ok.cycle)
      : undefined;
  const closed = ucApplication && deadlines.status === "ok" && deadlines.now > new Date(ucApplication.due_at);

  const open = (p: Prompt) => {
    const href = essaysHref(`edit/?q=${p.key}`);
    if (href) router.push(href, { transitionTypes: ["push"] });
  };

  function toggle(p: Prompt) {
    if (!ok) return;
    const outcome = choose(p, optional, ok.drafts);
    if (outcome === "limit") return setToast((t) => ({ key: (t?.key ?? 0) + 1, text: `You've chosen ${CHOOSE}. Remove one first.` }));
    if (outcome === "confirm-remove") return setRemoving({ prompt: p, open: true });
    saveDraft(p.cycle, p.key, { chosen: outcome === "chosen" });
  }

  return (
    <div className="min-h-dvh overflow-x-clip bg-sky-50">
      <main className="mx-auto max-w-[480px]" style={{ paddingBottom: "calc(var(--safe-bottom) + 24px)" }}>
        {/* The Essays panel (16 → Feature panels): solid indigo from the physical top, the full width, 28 bottom
            corners, every word white. It ends 24 below the bar. */}
        <header className="relative pb-6 text-white" style={{ paddingTop: "calc(var(--safe-top) + var(--strip-h) + 8px)" }}>
          <span aria-hidden className="absolute inset-y-0 left-1/2 w-screen -translate-x-1/2 rounded-b-[28px] bg-indigo-600" />
          <div className="relative px-4 [&_button:focus-visible]:outline-white">
            <BackButton fallback="/" slideBack />
          </div>
          <h1 className="relative mt-6 px-6 type-title-1">Personal insight answers</h1>
          <p className="relative mt-1 px-6 tabular-nums type-body">
            {done} of {ANSWERS} done
          </p>
          <div className="relative">
            <PanelBar segments={segments} />
          </div>
        </header>

        {state.status === "loading" && (
          <div className="pt-12">
            <Loading label="Loading your answers" />
          </div>
        )}

        {state.status === "error" && (
          <div className="mx-4 mt-6">
            <InlineError
              title="Couldn't load your answers"
              body="Check your connection, then try again."
              action={<TintedButton onClick={retryEssays}>Try again</TintedButton>}
            />
          </div>
        )}

        {ok && (
          <>
            <div className="mt-6 max-w-[368px] px-6 text-slate-600 type-body">
              <p>
                UC asks transfer students for {ANSWERS} answers, up to {WORD_LIMIT} words each. One is required; you choose the other {CHOOSE}.
                {noUc && " These are for UC applications."}
              </p>
              {closed && ucApplication && (
                <p className="mt-2">
                  The {cycleLabel(ok.cycle ?? "").toLowerCase()} UC application closed {shortDate(ucApplication.due_at)}. Your drafts stay here.
                </p>
              )}
            </div>

            <h2 className="mt-6 px-6 text-slate-600 type-label">Required</h2>
            <ul className="mx-4 mt-2 divide-y divide-border rounded-md border border-border bg-surface">
              {required.map((p) => (
                <QuestionRow key={p.key} prompt={p} draft={ok.drafts[draftKey(p.cycle, p.key)]} onOpen={() => open(p)} />
              ))}
            </ul>

            <h2 className="mt-6 px-6 text-slate-600 tabular-nums type-label">
              Choose {CHOOSE} ({chosen} chosen)
            </h2>
            <ul className="mx-4 mt-2 divide-y divide-border rounded-md border border-border bg-surface">
              {optional.map((p) => {
                const isChosen = Boolean(ok.drafts[draftKey(p.cycle, p.key)]?.chosen);
                return (
                  <QuestionRow
                    key={p.key}
                    prompt={p}
                    draft={ok.drafts[draftKey(p.cycle, p.key)]}
                    choice={{ chosen: isChosen, dimmed: !isChosen && chosen >= CHOOSE, onToggle: () => toggle(p) }}
                    onOpen={() => open(p)}
                  />
                );
              })}
            </ul>

            {ok.prompts.length > 0 && (
              <>
                <p className="mt-6 max-w-[368px] px-6 text-slate-600 type-caption">{sourceLine(ok.prompts)}</p>
                {/* The link's 4 padding makes the 12 below the source line */}
                <div className="mt-2 px-6">
                  <LinkLine href={ok.prompts[0].source_url} label="Read UC's exact wording" />
                </div>
              </>
            )}
          </>
        )}

        <UnofficialFooter className="mt-4 px-4" />
      </main>

      <RemoveSheet
        open={Boolean(removing?.open)}
        name={removing?.prompt.short_name ?? ""}
        onClose={() => setRemoving((r) => (r ? { ...r, open: false } : r))}
        onRemove={() => {
          if (removing) saveDraft(removing.prompt.cycle, removing.prompt.key, { chosen: false });
          setRemoving((r) => (r ? { ...r, open: false } : r));
        }}
      />

      {toast && <Toast key={toast.key} message={toast.text} bottom={TOAST_BOTTOM} onDone={() => setToast(null)} />}
    </div>
  );
}
