"use client";

import { useState } from "react";
import { AfterWait } from "@/components/deadlines/after-wait";
import { ProgressRing } from "@/components/ui/progress-ring";
import { StatusControl } from "@/components/ui/status-control";
import { Toast } from "@/components/ui/toast";
import { markStep, type DeadlinesState } from "@/lib/data/deadlines";
import { checklistSubtitle, checklistTitle } from "@/lib/deadlines";
import { StepsSheet } from "./steps-sheet";

const SHOWN_STEPS = 2;

// Home's Get ready card (14): the steps of the application due next, which the student checks off themselves.
// Hidden when dates couldn't load, and once the application's due date has passed.
export function GetReadyCard({ state, toastBottom }: { state: DeadlinesState; toastBottom: string }) {
  const [sheet, setSheet] = useState<{ open: boolean; focus: string | null }>({ open: false, focus: null });
  const [toast, setToast] = useState<{ key: number; stepId: string } | null>(null);
  // A step just checked on the card stays a moment, so the fill is seen before the next step comes up
  const [settling, setSettling] = useState<string[]>([]);

  if (state.status === "error") return null;
  if (state.status === "loading") {
    return (
      <AfterWait>
        <div aria-hidden className="mx-4 mt-6 h-[236px] rounded-lg bg-stack-2" />
      </AfterWait>
    );
  }
  const c = state.checklist;
  if (!c) return null;

  const total = c.steps.length;
  const finished = c.doneCount === total;
  const next = c.steps.filter((s) => !s.done || settling.includes(s.step.id)).slice(0, SHOWN_STEPS);

  function check(stepId: string, done: boolean, fromCard: boolean) {
    markStep(stepId, done);
    if (done && fromCard) {
      setSettling((ids) => [...ids, stepId]);
      setTimeout(() => setSettling((ids) => ids.filter((id) => id !== stepId)), 450);
    }
    try {
      navigator.vibrate?.(10);
    } catch {}
    setToast((t) => (done && fromCard ? { key: (t?.key ?? 0) + 1, stepId } : null));
  }

  return (
    <section aria-labelledby="get-ready-title" className="mx-4 mt-6 rounded-lg bg-surface p-4 shadow-card">
      <div className="flex items-start gap-4">
        <ProgressRing done={c.doneCount} total={total} size={56} />
        <div className="min-w-0 flex-1">
          <h2 id="get-ready-title" className="line-clamp-2 text-navy-900 type-title-3">
            {checklistTitle(c)}
          </h2>
          <p className="mt-1 text-slate-600 type-body">
            {!finished && (
              <span className="sr-only">
                {c.doneCount} of {total} steps done.{" "}
              </span>
            )}
            {checklistSubtitle(c)}
          </p>
        </div>
      </div>

      {!finished && (
        <ul className="mt-4 flex flex-col">
          {next.map(({ step, done }) => (
            <li key={step.id} className="flex min-h-11 items-center gap-1.5">
              {/* 24 ring in a 44 target, so the text starts 16 from the ring */}
              <StatusControl
                size={24}
                done={done}
                restStatus="not_started"
                label={`Mark ${step.title} complete`}
                onToggle={() => check(step.id, !done, true)}
                className="-ml-2.5 shrink-0"
              />
              <button
                type="button"
                onClick={() => setSheet({ open: true, focus: step.id })}
                className="min-h-11 min-w-0 flex-1 rounded-sm py-2.5 text-left text-navy-900 type-body-md pressed:text-slate-700"
              >
                <span className="line-clamp-2">{step.title}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className={finished ? "mt-3 flex justify-end" : "mt-2 flex justify-end"}>
        <button
          type="button"
          onClick={() => setSheet({ open: true, focus: null })}
          className="-my-[13px] -mx-2.5 px-2.5 py-[13px] text-blue-600 type-label pressed:underline focus-ring:underline"
        >
          See all {total} steps
        </button>
      </div>

      <StepsSheet
        open={sheet.open}
        onClose={() => setSheet((s) => ({ ...s, open: false }))}
        checklist={c}
        focusStep={sheet.focus}
        onToggle={(id, done) => check(id, done, false)}
      />

      {toast && (
        <Toast
          key={toast.key}
          message="Marked complete"
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
