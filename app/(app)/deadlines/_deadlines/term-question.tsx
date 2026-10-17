"use client";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { ChoiceChip, ChoiceChips } from "@/components/ui/choice-chip";

// The terms a student can pick. null is "Not sure yet": the screen shows the nearest cycle with upcoming dates.
const TERMS: { value: string | null; label: string }[] = [
  { value: "fall-2027", label: "Fall 2027" },
  { value: "fall-2028", label: "Fall 2028" },
  { value: null, label: "Not sure yet" },
];

function TermChips({ chosen, onChoose }: { chosen: string | null | undefined; onChoose: (term: string | null) => void }) {
  return (
    <ChoiceChips aria-label="Transfer term">
      {TERMS.map((t) => (
        <ChoiceChip key={t.label} checked={chosen === t.value} onSelect={() => onChoose(t.value)}>
          {t.label}
        </ChoiceChip>
      ))}
    </ChoiceChips>
  );
}

// Asked once, the first time, in place of the term line (14 → Term question)
export function TermQuestion({ onChoose }: { onChoose: (term: string | null) => void }) {
  return (
    <section aria-labelledby="term-question-title" className="rounded-lg bg-surface p-4 shadow-card">
      <h2 id="term-question-title" className="text-navy-900 type-headline">
        When do you plan to transfer?
      </h2>
      <p className="mt-1 text-slate-600 type-body">We&apos;ll show the dates for that application cycle.</p>
      <div className="mt-3">
        <TermChips chosen={undefined} onChoose={onChoose} />
      </div>
    </section>
  );
}

// "Change" on the term line: the same chips, with the current choice selected (none while it's never been answered)
export function TermSheet({ open, onClose, term, onChoose }: { open: boolean; onClose: () => void; term: string | null | undefined; onChoose: (term: string | null) => void }) {
  return (
    <BottomSheet open={open} onClose={onClose} labelledBy="term-sheet-title">
      <h2 id="term-sheet-title" tabIndex={-1} className="text-navy-900 type-title-2 focus:outline-none">
        When do you plan to transfer?
      </h2>
      <p className="mt-1 text-slate-600 type-body">We&apos;ll show the dates for that application cycle.</p>
      <div className="mt-4">
        <TermChips chosen={term} onChoose={onChoose} />
      </div>
    </BottomSheet>
  );
}
