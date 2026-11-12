"use client";

import { MinusIcon, PlusIcon } from "@phosphor-icons/react/ssr";
import { CircleButton } from "./circle-button";

type StepperProps = {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  // "Units per term"
  label: string;
  // "15 units"
  format: (value: number) => string;
};

// A number one step at a time: minus, the value, plus. Each end stops at its limit.
export function Stepper({ value, min, max, onChange, label, format }: StepperProps) {
  return (
    <div role="group" aria-label={label} className="flex items-center gap-4">
      <CircleButton
        aria-label={`Fewer, ${format(value - 1)}`}
        icon={<MinusIcon weight="bold" size={22} aria-hidden />}
        aria-disabled={value <= min || undefined}
        className="aria-disabled:opacity-40"
        onClick={() => value > min && onChange(value - 1)}
      />
      <p aria-live="polite" className="min-w-[88px] text-center text-navy-900 tabular-nums type-title-3">
        {format(value)}
      </p>
      <CircleButton
        aria-label={`More, ${format(value + 1)}`}
        icon={<PlusIcon weight="bold" size={22} aria-hidden />}
        aria-disabled={value >= max || undefined}
        className="aria-disabled:opacity-40"
        onClick={() => value < max && onChange(value + 1)}
      />
    </div>
  );
}
