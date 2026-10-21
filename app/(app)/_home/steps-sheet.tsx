"use client";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { LinkLine } from "@/components/ui/link-line";
import { SegmentedBar } from "@/components/ui/segmented-bar";
import { StepTile } from "@/components/ui/step-tile";
import { cn } from "@/lib/cn";
import { checklistSource, checklistTitle, shortDate, type ChecklistView } from "@/lib/deadlines";

type StepsSheetProps = {
  open: boolean;
  onClose: () => void;
  checklist: ChecklistView;
  // The line under a step's title (step-caption.ts): what checked it, or how far Essays is
  caption: (entry: ChecklistView["steps"][number]) => string | null;
  onToggle: (stepId: string, done: boolean) => void;
  // A row's text opens that step's own sheet (18 → Step sheets)
  onOpenStep: (stepId: string) => void;
  // One step left and not yet finished on this device: checking it gets the bigger burst (16 → All steps done)
  finale: boolean;
};

// Every step of the application, done and not done, with the official site and where the steps come from (14 → Steps sheet)
export function StepsSheet({ open, onClose, checklist: c, caption, onToggle, onOpenStep, finale }: StepsSheetProps) {
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

        <ol className="mt-4 flex flex-col">
          {c.steps.map((entry) => {
            const { step, done } = entry;
            const note = caption(entry);
            return (
              <li key={step.id} className="-mx-2 flex min-h-14 items-start gap-2.5 px-2 py-2">
                {/* The 40 tile sits at the row's padding inside its 44 target, so the text starts 12 after the tile */}
                <StepTile title={step.title} size={40} done={done} finale={finale && !done} onToggle={() => onToggle(step.id, !done)} className="-m-0.5" />
                {/* The text opens the step's own sheet, and its tap area runs the row's full height */}
                <button
                  type="button"
                  onClick={() => onOpenStep(step.id)}
                  className="-my-2 min-w-0 flex-1 rounded-sm pb-2 pt-4 text-left transition-colors duration-200 ease-out pressed:bg-surface-pressed pressed:duration-120"
                >
                  <span className={cn("block type-row-title", done ? "text-slate-600" : "text-navy-900")}>{step.title}</span>
                  {note && <span className="mt-0.5 block text-slate-600 tabular-nums type-caption">{note}</span>}
                  <span className="mt-0.5 block text-slate-600 type-body">{step.summary}</span>
                </button>
              </li>
            );
          })}
        </ol>

        {/* It leaves the app, so it's a link line, not the main action (18 → Link lines). Its 4 padding counts toward the gaps. */}
        <LinkLine href={c.checklist.apply_url} label={c.checklist.apply_label} className="mt-5" />
        <p className="mt-2 text-slate-600 type-caption">{checklistSource(c)}</p>
      </div>
    </BottomSheet>
  );
}
