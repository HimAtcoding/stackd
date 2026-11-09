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

// One of a radio group, as 00's filter chip: 40 tall (44 to tap), --r-sm, with an edge. Off: white with a 2 px border.
// On: solid --blue-600 with a check before the label.
export function ChoiceChip({ checked, onSelect, children, ...data }: ChoiceChipProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      {...data}
      className={cn(
        "relative inline-flex h-10 items-center gap-1.5 rounded-sm px-3.5 type-label edge-sm after:absolute after:inset-x-0 after:-inset-y-0.5 after:content-['']",
        checked ? "bg-blue-600 text-white edge-blue-700 focus-ring:outline-offset-3" : "border-2 border-border bg-surface text-navy-900",
      )}
    >
      {checked && <CheckIcon weight="bold" size={16} aria-hidden />}
      {children}
    </button>
  );
}

// Chips in a row that wraps, 8 apart. `scroll`: one row that scrolls sideways instead (22 → 4); the screen sets its
// padding so the first and last chips line up with the page.
export function ChoiceChips({ "aria-label": label, scroll, className, children }: { "aria-label": string; scroll?: boolean; className?: string; children: ReactNode }) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("flex gap-2", scroll ? "overflow-x-auto [scrollbar-width:none] [&>*]:shrink-0 [&::-webkit-scrollbar]:hidden" : "flex-wrap", className)}
    >
      {children}
    </div>
  );
}
