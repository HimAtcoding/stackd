"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Stepper } from "@/components/ui/stepper";
import { Switch } from "@/components/ui/switch";
import { TextField } from "@/components/ui/text-field";
import type { TermId } from "@/lib/plan/build";
import type { PlanSettings } from "@/lib/plan/view";
import { termLabel } from "@/lib/plan/warnings";

type Load = "part" | "full" | "custom";

const LOADS: { value: Load; label: string }[] = [
  { value: "part", label: "Part time" },
  { value: "full", label: "Full time" },
  { value: "custom", label: "Custom" },
];

const UNITS_OF: Record<Exclude<Load, "custom">, number> = { part: 9, full: 15 };

const unitsText = (n: number) => `${n} ${n === 1 ? "unit" : "units"}`;

type SettingsSheetProps = {
  open: boolean;
  onClose: () => void;
  settings: PlanSettings;
  firstTerm: TermId | null;
  onChange: (change: Partial<PlanSettings>) => void;
};

function Content({ settings, firstTerm, onChange }: Omit<SettingsSheetProps, "open" | "onClose">) {
  const units = settings.units_per_term;
  const [load, setLoad] = useState<Load>(units === 9 ? "part" : units === 15 ? "full" : "custom");
  const [done, setDone] = useState(settings.units_done === null ? "" : String(settings.units_done));
  const [doneError, setDoneError] = useState<string | undefined>();

  function changeDone(text: string) {
    setDone(text);
    if (!text.trim()) {
      setDoneError(undefined);
      return onChange({ units_done: null });
    }
    const n = Number(text.trim());
    if (!Number.isFinite(n) || n < 0 || n > 200) return setDoneError("Units are a number from 0 to 200");
    setDoneError(undefined);
    onChange({ units_done: Math.round(n * 10) / 10 });
  }

  return (
    <div className="-mx-6 -mt-6 max-h-[calc(100dvh-var(--safe-top)-72px)] overflow-y-auto px-6 pt-6">
      <h2 id="plan-settings-title" tabIndex={-1} className="text-navy-900 type-title-2 focus:outline-none">
        Units and terms
      </h2>

      <h3 className="mt-5 text-navy-900 type-headline">Units per term</h3>
      <SegmentedControl
        options={LOADS}
        value={load}
        aria-label="Units per term"
        className="mt-2"
        onChange={(l) => {
          setLoad(l);
          if (l !== "custom") onChange({ units_per_term: UNITS_OF[l] });
        }}
      />
      {load === "custom" ? (
        <div className="mt-3">
          <Stepper value={units} min={3} max={21} label="Units per term" format={unitsText} onChange={(n) => onChange({ units_per_term: n })} />
        </div>
      ) : (
        <p className="mt-2 text-slate-600 tabular-nums type-caption">{unitsText(units)} a term</p>
      )}

      <div className="mt-5 flex min-h-11 items-center justify-between gap-4">
        <span id="summer-label" className="text-navy-900 type-headline">
          Include summer terms
        </span>
        <Switch checked={settings.include_summer} onChange={(on) => onChange({ include_summer: on })} aria-labelledby="summer-label" />
      </div>

      <h3 className="mt-5 text-navy-900 type-headline">First term</h3>
      <p className="mt-1 text-slate-700 type-body">{firstTerm ? `${termLabel(firstTerm)}, the term you're in now` : "None before your transfer term"}</p>

      <TextField
        id="units-done"
        label="Transferable units you've finished"
        inputMode="decimal"
        placeholder="Optional"
        value={done}
        error={doneError}
        hint="Check your transcript. Leave empty to count the courses marked done here."
        onChange={(e) => changeDone(e.target.value)}
        className="mt-5"
      />

      <h3 className="mt-5 text-navy-900 type-headline">GE pattern</h3>
      <p className="mt-1 text-slate-700 type-body">Cal-GETC</p>
      <p className="mt-1 text-slate-600 type-caption">
        Started college before fall 2025? You may be able to use IGETC or CSU GE instead. Ask your counselor.
      </p>
    </div>
  );
}

// Plan settings (24 → 6). Saves on change.
export function SettingsSheet({ open, onClose, ...rest }: SettingsSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} labelledBy="plan-settings-title">
      {open && <Content {...rest} />}
    </BottomSheet>
  );
}
