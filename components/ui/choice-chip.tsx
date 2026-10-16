"use client";

import type { ReactNode } from "react";
import { CheckIcon } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/cn";

type ChoiceChipProps = {
  checked: boolean;
  onSelect: () => void;
  children: string;
  "data-pressed"?: boolean;
  "data-focus"?: boolean;
};

// 44 tall pill, one of a radio group (14 → Additions to 00). Chosen: blue tint with a check before the label.
export function ChoiceChip({ checked, onSelect, children, ...data }: ChoiceChipProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      {...data}
      className={cn(
        "inline-flex h-11 items-center gap-1.5 rounded-full border px-4 type-label transition-colors duration-120 ease-out",
        checked ? "border-blue-50-border bg-blue-50 text-blue-700" : "border-border-strong bg-surface text-navy-900 pressed:bg-surface-pressed",
      )}
    >
      {checked && <CheckIcon weight="bold" size={16} aria-hidden />}
      {children}
    </button>
  );
}

// Chips in a row that wraps, 8 apart
export function ChoiceChips({ "aria-label": label, children }: { "aria-label": string; children: ReactNode }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {children}
    </div>
  );
}
