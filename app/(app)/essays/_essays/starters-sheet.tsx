"use client";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { ChoiceCircle } from "@/components/ui/choice-row";
import { cn } from "@/lib/cn";
import type { Starter } from "@/lib/piq-starters";

type StartersSheetProps = {
  open: boolean;
  starters: Starter[];
  // Starter ids already in Notes: checked and disabled
  used: Set<string>;
  onPick: (id: string) => void;
  onClose: () => void;
};

// "Add a starter question" (20 → 3): the question's four starters in UC's order
export function StartersSheet({ open, starters, used, onPick, onClose }: StartersSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} labelledBy="starters-title">
      <h2 id="starters-title" tabIndex={-1} className="text-navy-900 type-title-2 focus:outline-none">
        Starter questions
      </h2>
      <ul className="-mx-6 mt-3 divide-y divide-border border-y border-border">
        {starters.map((s) => {
          const inNotes = used.has(s.id);
          return (
            <li key={s.id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={inNotes}
                disabled={inNotes}
                aria-disabled={inNotes || undefined}
                onClick={() => onPick(s.id)}
                className={cn(
                  "flex min-h-14 w-full items-center gap-4 px-6 py-3 text-left transition-colors duration-200 ease-out",
                  "pressed:bg-surface-pressed pressed:duration-120 focus-ring:-outline-offset-2",
                  inNotes && "opacity-40",
                )}
              >
                <ChoiceCircle checked={inNotes} />
                <span className="min-w-0 flex-1 text-navy-900 type-row-title">{s.text}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </BottomSheet>
  );
}
