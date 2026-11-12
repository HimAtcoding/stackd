"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { ChoiceList, ChoiceRow } from "@/components/ui/choice-row";
import { PrimaryButton } from "@/components/ui/primary-button";
import { TextField } from "@/components/ui/text-field";
import type { Card } from "@/lib/plan/view";

type FinishedSheetProps = {
  open: boolean;
  onClose: () => void;
  // Every course and area the builder would place
  cards: Card[];
  unitsDone: number | null;
  // The keys checked, and the units typed (null: empty, undefined: not valid, so left as it was)
  onBuild: (finished: Set<string>, unitsDone: number | null | undefined) => void;
  onSkip: () => void;
};

function Rows({ label, cards, checked, onToggle }: { label: string; cards: Card[]; checked: Set<string>; onToggle: (key: string) => void }) {
  if (cards.length === 0) return null;
  return (
    <>
      <h3 className="mt-5 text-navy-900 type-headline">{label}</h3>
      <ChoiceList role="group" aria-label={label} className="mt-2">
        {cards.map((c) => (
          <ChoiceRow
            key={c.key}
            role="checkbox"
            checked={checked.has(c.key)}
            name={c.name}
            detail={c.kind === "ge" ? `Cal-GETC Area ${c.geArea}` : null}
            onSelect={() => onToggle(c.key)}
          />
        ))}
      </ChoiceList>
    </>
  );
}

function Content({ cards, unitsDone, onBuild, onSkip }: Omit<FinishedSheetProps, "open" | "onClose">) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [units, setUnits] = useState(unitsDone === null ? "" : String(unitsDone));
  const [error, setError] = useState<string | undefined>();

  const toggle = (key: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  function build() {
    if (!units.trim()) return onBuild(checked, null);
    const n = Number(units.trim());
    if (!Number.isFinite(n) || n < 0 || n > 200) return setError("Units are a number from 0 to 200");
    onBuild(checked, Math.round(n * 10) / 10);
  }

  return (
    <div className="-mx-6 -mt-6 flex max-h-[calc(100dvh-var(--safe-top)-48px)] flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-6 pb-5">
        <h2 id="finished-title" tabIndex={-1} className="text-navy-900 type-title-2 focus:outline-none">
          What have you already finished?
        </h2>
        <p className="mt-2 text-slate-600 type-body">Check what you&apos;ve passed. Your plan leaves those out.</p>
        <Rows label="Your major" cards={cards.filter((c) => c.kind === "major")} checked={checked} onToggle={toggle} />
        <Rows label="Cal-GETC" cards={cards.filter((c) => c.kind === "ge")} checked={checked} onToggle={toggle} />
        <TextField
          id="finished-units"
          label="Units you've finished"
          inputMode="decimal"
          placeholder="Optional"
          value={units}
          error={error}
          hint="Transferable units from your transcript. Leave empty to count what you checked."
          onChange={(e) => {
            setUnits(e.target.value);
            setError(undefined);
          }}
          className="mt-5"
        />
      </div>
      {/* The list scrolls; the two ways out stay in reach */}
      <div className="border-t-2 border-border px-6 pt-4">
        <PrimaryButton onClick={build}>Build my plan</PrimaryButton>
        <div className="mt-3 flex justify-center">
          <button type="button" onClick={onSkip} className="-my-3 py-3 text-slate-600 type-link pressed:underline focus-ring:underline">
            Skip, build now
          </button>
        </div>
      </div>
    </div>
  );
}

// Before the first build (24 → 5): what's done already, so the plan doesn't place it. Major courses are marked done the
// same way Explore marks them; GE areas become done items.
export function FinishedSheet({ open, onClose, ...rest }: FinishedSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} labelledBy="finished-title">
      {open && <Content {...rest} />}
    </BottomSheet>
  );
}
