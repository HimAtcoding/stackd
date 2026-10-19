"use client";

import { useEffect, useRef } from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { OutsideLinkRow } from "@/components/ui/outside-link-row";
import { SegmentedBar } from "@/components/ui/segmented-bar";
import { StepTile } from "@/components/ui/step-tile";
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
        {/* The same bar as Home's Get ready, in place of the ring (16 → Steps sheet) */}
        <SegmentedBar steps={c.steps.map((s) => s.done)} className="mt-3" />
        <p className="mt-1.5 text-slate-600 tabular-nums type-body">
          {c.doneCount} of {c.steps.length} done, due by {shortDate(c.deadline.due_at)}
        </p>

        <ol ref={list} className="mt-4 flex flex-col">
          {c.steps.map(({ step, done }) => (
            <li
              key={step.id}
              data-step={step.id}
              className={cn("-mx-2 flex min-h-14 items-start gap-2.5 rounded-md px-2 py-2", focusStep === step.id && "tint-flash")}
            >
              {/* The 40 tile sits at the row's padding inside its 44 target, so the text starts 12 after the tile */}
              <StepTile title={step.title} size={40} done={done} onToggle={() => onToggle(step.id, !done)} className="-m-0.5" />
              <div className="min-w-0 flex-1 pt-2">
                <p className={cn("type-row-title", done ? "text-slate-600" : "text-navy-900")}>{step.title}</p>
                <p className="mt-0.5 text-slate-600 type-body">{step.summary}</p>
              </div>
            </li>
          ))}
        </ol>

        {/* It leaves the app, so it's a link row, not the main action (16 → Outside-link row) */}
        <OutsideLinkRow href={c.checklist.apply_url} title={c.checklist.apply_label} className="mt-6" />
        <p className="mt-3 text-slate-600 type-caption">{checklistSource(c)}</p>
      </div>
    </BottomSheet>
  );
}
