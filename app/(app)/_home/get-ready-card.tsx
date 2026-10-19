"use client";

import { useState } from "react";
import { AfterWait } from "@/components/deadlines/after-wait";
import { SegmentedBar } from "@/components/ui/segmented-bar";
import { StepTile } from "@/components/ui/step-tile";
import { Toast } from "@/components/ui/toast";
import { checklistCelebrated, claimChecklistReady } from "@/lib/celebration";
import { markStep, type DeadlinesState } from "@/lib/data/deadlines";
import { checklistSubtitle, checklistTitle } from "@/lib/deadlines";
import { StepSheet } from "./step-sheet";
import { StepsSheet } from "./steps-sheet";

const SHOWN_STEPS = 2;
// The steps sheet slides away in 200 ms before a step's sheet opens over the page (18 → Step sheets)
const SHEET_SWAP_MS = 200;

// Home's Get ready (15 → Get ready): the steps of the application due next, which the student checks off themselves.
// The title, count and segmented bar sit on the page; the next two steps are a tier 2 list.
// Hidden when dates couldn't load, and once the application's due date has passed.
export function GetReadyCard({ state, toastBottom }: { state: DeadlinesState; toastBottom: string }) {
  const [sheet, setSheet] = useState(false);
  // The step sheet; the id stays while it slides away
  const [stepSheet, setStepSheet] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  // `ready`: this check finished the checklist (16 → All steps done)
  const [toast, setToast] = useState<{ key: number; stepId: string; ready?: boolean } | null>(null);
  // A step just checked on Home stays a moment, so the fill is seen before the next step comes up
  const [settling, setSettling] = useState<string[]>([]);

  if (state.status === "error") return null;
  if (state.status === "loading") {
    return (
      <AfterWait>
        <div aria-hidden className="mx-4 mt-6 h-[221px] rounded-md bg-stack-2" />
      </AfterWait>
    );
  }
  const c = state.checklist;
  if (!c) return null;

  const total = c.steps.length;
  const finished = c.doneCount === total;
  const next = c.steps.filter((s) => !s.done || settling.includes(s.step.id)).slice(0, SHOWN_STEPS);
  // One step left, and this checklist hasn't been finished on this device yet: checking it gets the bigger burst
  const finale = c.doneCount === total - 1 && !checklistCelebrated(c.checklist.id);

  const view = c;
  function check(stepId: string, done: boolean, fromHome: boolean) {
    // The last step done finishes the checklist; the reward comes once per checklist per device
    const finishes = done && view.doneCount === total - 1 && view.steps.some((s) => s.step.id === stepId && !s.done);
    const ready = finishes && claimChecklistReady(view.checklist.id);
    markStep(stepId, done);
    if (done && fromHome) {
      setSettling((ids) => [...ids, stepId]);
      setTimeout(() => setSettling((ids) => ids.filter((id) => id !== stepId)), 450);
    }
    try {
      navigator.vibrate?.(10);
    } catch {}
    setToast((t) => (ready || (done && fromHome) ? { key: (t?.key ?? 0) + 1, stepId, ready } : null));
  }

  return (
    <section aria-labelledby="get-ready-title" className="mt-6">
      <div className="flex items-baseline justify-between gap-3 px-6">
        <h2 id="get-ready-title" className="line-clamp-2 min-w-0 text-navy-900 type-title-3">
          {checklistTitle(c)}
        </h2>
        <p className="shrink-0 text-slate-600 tabular-nums type-label">
          {c.doneCount} of {total}
          <span className="sr-only"> steps done</span>
        </p>
      </div>
      <p className="mt-1 px-6 text-slate-600 type-body">{checklistSubtitle(c)}</p>
      <SegmentedBar steps={c.steps.map((s) => s.done)} className="mx-6 mt-3" />

      {/* Once every step is done, the list goes, after the last check has settled so its burst is seen */}
      {(!finished || settling.length > 0) && (
        <>
          <ul className="mx-4 mt-4 divide-y divide-border rounded-md border border-border bg-surface">
            {next.map(({ step, done }) => (
              <li key={step.id} className="flex min-h-14 items-center gap-2 px-4">
                {/* The 36 tile sits at the row's padding inside its 44 target, so the text starts 12 after the tile */}
                <StepTile title={step.title} done={done} finale={finale && !done} onToggle={() => check(step.id, !done, true)} className="-mx-1" />
                <button
                  type="button"
                  onClick={() => setStepSheet({ open: true, id: step.id })}
                  className="min-h-11 min-w-0 flex-1 rounded-sm py-2.5 text-left text-navy-900 type-body-md pressed:text-slate-700"
                >
                  <span className="line-clamp-2">{step.title}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex justify-end px-6">
            <button
              type="button"
              onClick={() => setSheet(true)}
              className="-my-[13px] -mx-2.5 px-2.5 py-[13px] text-blue-600 type-label pressed:underline focus-ring:underline"
            >
              See all {total} steps
            </button>
          </div>
        </>
      )}

      <StepsSheet
        open={sheet}
        onClose={() => setSheet(false)}
        checklist={c}
        finale={finale}
        onToggle={(id, done) => check(id, done, false)}
        onOpenStep={(id) => {
          setSheet(false);
          setTimeout(() => setStepSheet({ open: true, id }), SHEET_SWAP_MS);
        }}
      />
      <StepSheet
        open={stepSheet.open}
        onClose={() => setStepSheet((s) => ({ ...s, open: false }))}
        checklist={c}
        stepId={stepSheet.id}
        onToggle={(id, done) => check(id, done, false)}
      />

      {toast && (
        <Toast
          key={toast.key}
          // The toast follows the all-done title: "Your UC application is ready!" or "All 6 steps checked!" (18 → All-done wording)
          message={toast.ready ? `${checklistTitle(c)}!` : "Marked complete"}
          overSheet={sheet || stepSheet.open}
          action={{
            label: "Undo",
            onClick: () => {
              markStep(toast.stepId, false);
              setToast(null);
            },
          }}
          bottom={toastBottom}
          onDone={() => setToast(null)}
        />
      )}
    </section>
  );
}
