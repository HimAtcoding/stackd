"use client";

import type { ReactNode } from "react";
import { CheckIcon } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/cn";

// 24 circle at the start of a choice row. Blue, not green: green means done, and this is a choice.
export function ChoiceCircle({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-120 ease-out",
        checked ? "border-blue-600 bg-blue-600" : "border-slate-400",
      )}
    >
      <CheckIcon weight="bold" size={14} className={cn("text-white transition-opacity duration-120 ease-out", !checked && "opacity-0")} />
    </span>
  );
}

type ChoiceRowProps = {
  // radio: one of its list. checkbox: any number.
  role: "radio" | "checkbox";
  checked: boolean;
  name: string;
  // Second line: the city, or the degree
  detail?: string | null;
  // While saving: still shown, but taps do nothing
  readOnly?: boolean;
  onSelect: () => void;
  "data-pressed"?: boolean;
  "data-focus"?: boolean;
};

// The whole row is the button (10 → Choice list). 56 tall, 64 with a second line.
export function ChoiceRow({ role, checked, name, detail, readOnly, onSelect, ...data }: ChoiceRowProps) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={checked}
      aria-disabled={readOnly || undefined}
      onClick={() => {
        if (!readOnly) onSelect();
      }}
      {...data}
      className={cn(
        "flex w-full items-center gap-4 px-4 py-2 text-left transition-colors duration-120 ease-out",
        "pressed:bg-surface-pressed focus-ring:-outline-offset-2",
        detail ? "min-h-16" : "min-h-14",
        checked && "bg-blue-50",
      )}
    >
      <ChoiceCircle checked={checked} />
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 text-navy-900 type-row-title">{name}</span>
        {detail && <span className="mt-0.5 block text-slate-600 type-caption">{detail}</span>}
      </span>
    </button>
  );
}

type ChoiceListProps = {
  role: "radiogroup" | "group";
  "aria-label": string;
  readOnly?: boolean;
  className?: string;
  children: ReactNode;
};

// The list container from 03, holding choice rows with a line between them. The screen sets its margins.
export function ChoiceList({ role, readOnly, className, children, ...rest }: ChoiceListProps) {
  return (
    <div
      role={role}
      {...rest}
      className={cn(
        "divide-y divide-border overflow-hidden rounded-md border border-border bg-surface shadow-card transition-opacity duration-120",
        readOnly && "opacity-60",
        className,
      )}
    >
      {children}
    </div>
  );
}
