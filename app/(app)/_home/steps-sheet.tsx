"use client";

import { useEffect, useRef } from "react";
import { ArrowSquareOutIcon } from "@phosphor-icons/react/ssr";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { ProgressRing } from "@/components/ui/progress-ring";
import { StatusControl } from "@/components/ui/status-control";
import { TintedButton } from "@/components/ui/tinted-button";
import { cn } from "@/lib/cn";
import { checklistSource, checklistTitle, shortDate, type ChecklistView } from "@/lib/deadlines";

type StepsSheetProps = {
  open: boolean;
  onClose: () => void;
  checklist: ChecklistView;
  // The step the student tapped on Home: scrolled into view and tinted for 600 ms
  focusStep: string | null;
  onToggle: (stepId: string, done: boolean) => void;
};

// Every step of the application, done and not done, with the official site and where the steps come from (14 → Steps sheet)
export function StepsSheet({ open, onClose, checklist: c, focusStep, onToggle }: StepsSheetProps) {
  const list = useRef<HTMLOListElement>(null);

  useEffect(() => {
    if (open && focusStep) list.current?.querySelector(`[data-step="${focusStep}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, focusStep]);

  return (
    <BottomSheet open={open} onClose={onClose} labelledBy="steps-sheet-title">
      <div className="-mx-6 -mt-6 max-h-[calc(100dvh-var(--safe-top)-72px)] overflow-y-auto px-6 pt-6">
        <h2 id="steps-sheet-title" tabIndex={-1} className="text-navy-900 type-title-2 focus:outline-none">
          {checklistTitle(c)}
        </h2>
        <div className="mt-3 flex items-center gap-3">
          <ProgressRing done={c.doneCount} total={c.steps.length} size={40} />
          <p>
            <span className="block text-navy-900 tabular-nums type-label">
              {c.doneCount} of {c.steps.length}
            </span>
            <span className="block text-slate-600 type-body">Due {shortDate(c.deadline.due_at)}</span>
          </p>
        </div>

        <ol ref={list} className="mt-4 flex flex-col">
          {c.steps.map(({ step, done }) => (
            <li
              key={step.id}
              data-step={step.id}
              className={cn("-mx-2 flex items-start gap-2 rounded-md px-2 py-2", focusStep === step.id && "tint-flash")}
            >
              <StatusControl
                done={done}
                restStatus="not_started"
                label={`Mark ${step.title} complete`}
                onToggle={() => onToggle(step.id, !done)}
                className="-my-2 shrink-0"
              />
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-navy-900 type-row-title">{step.title}</p>
                <p className="mt-0.5 text-slate-600 type-body">{step.summary}</p>
              </div>
            </li>
          ))}
        </ol>

        <TintedButton
          href={c.checklist.apply_url}
          external
          icon={<ArrowSquareOutIcon weight="bold" size={20} aria-hidden />}
          className="mt-6"
        >
          {c.checklist.apply_label}
        </TintedButton>
        <p className="mt-3 text-slate-600 type-caption">{checklistSource(c)}</p>
      </div>
    </BottomSheet>
  );
}
