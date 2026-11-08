"use client";

import { useRef, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";

type SegmentedControlProps<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  "aria-label": string;
  className?: string;
};

// One choice from a few, always visible (00 → Segmented control). Neutral on purpose: green means done, blue means
// action. The thumb slides over 200 ms, and moves at once under reduced motion.
export function SegmentedControl<T extends string>({ options, value, onChange, className, ...rest }: SegmentedControlProps<T>) {
  const row = useRef<HTMLDivElement>(null);
  const at = Math.max(0, options.findIndex((o) => o.value === value));

  function onKeyDown(e: KeyboardEvent) {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = options[(at + step + options.length) % options.length];
    onChange(next.value);
    row.current?.querySelector<HTMLButtonElement>(`[data-value="${next.value}"]`)?.focus();
  }

  return (
    <div role="radiogroup" {...rest} onKeyDown={onKeyDown} className={cn("h-11 rounded-md border border-border bg-surface-pressed p-[3px]", className)}>
      <div ref={row} className="relative flex h-full">
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 rounded-sm bg-surface shadow-card transition-transform duration-200 ease-out motion-reduce:transition-none"
          style={{ width: `${100 / options.length}%`, transform: `translateX(${at * 100}%)` }}
        />
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              data-value={o.value}
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(o.value)}
              className={cn("relative flex-1 rounded-sm type-label", selected ? "text-navy-900" : "text-slate-600")}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
