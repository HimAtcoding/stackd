"use client";

import { useState, type ClipboardEvent, type Ref } from "react";
import { WarningCircleIcon } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/cn";
import { Expand } from "./expand";

const LENGTH = 6;

type CodeFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  // Called once when the sixth digit lands, typed, pasted or autofilled
  onComplete?: (value: string) => void;
  error?: string;
  readOnly?: boolean;
  ref?: Ref<HTMLInputElement>;
};

const digitsOnly = (text: string) => text.replace(/\D/g, "").slice(0, LENGTH);

// One real input drawn as six boxes (00 → Code field). A single input is what lets iOS offer the emailed code
// above the keyboard, and what makes pasting work. The input lies invisibly over the row and takes every tap.
export function CodeField({ id, label, value, onChange, onComplete, error, readOnly, ref }: CodeFieldProps) {
  const [focused, setFocused] = useState(false);
  const messageId = `${id}-message`;
  const next = Math.min(value.length, LENGTH - 1);

  function set(text: string) {
    const digits = digitsOnly(text);
    if (digits === value) return;
    onChange(digits);
    if (digits.length === LENGTH) onComplete?.(digits);
  }

  // maxlength would cut "Your code is 471 902" before any digit arrives, so a paste is read whole
  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    if (!readOnly) set(e.clipboardData.getData("text"));
  }

  return (
    <div>
      <label htmlFor={id} className="block text-navy-900 type-headline">
        {label}
      </label>
      <div className={cn("relative mt-2", readOnly && "opacity-60")}>
        <div aria-hidden className="grid grid-cols-6 gap-2">
          {Array.from({ length: LENGTH }, (_, i) => {
            const active = focused && i === next;
            return (
              <span
                key={i}
                className={cn(
                  "flex h-14 items-center justify-center rounded-sm border bg-surface text-navy-900 tabular-nums type-title-2",
                  "transition-[border-color,box-shadow] duration-120 ease-out",
                  error
                    ? cn("border-coral-700 shadow-[inset_0_0_0_1px_var(--coral-700)]", active && "shadow-[inset_0_0_0_1px_var(--coral-700),0_0_0_4px_rgba(3,100,250,.15)]")
                    : active
                      ? "border-blue-600 shadow-[inset_0_0_0_1px_var(--blue-600),0_0_0_4px_rgba(3,100,250,.15)]"
                      : "border-field-border",
                )}
              >
                {value[i] ?? (active && value.length < LENGTH ? <span className="code-caret h-6 w-0.5 rounded-[1px] bg-blue-600" /> : null)}
              </span>
            );
          })}
        </div>
        <input
          ref={ref}
          id={id}
          name={id}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={LENGTH}
          enterKeyHint="done"
          autoCorrect="off"
          spellCheck={false}
          value={value}
          readOnly={readOnly}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? messageId : undefined}
          onChange={(e) => set(e.target.value)}
          onPaste={onPaste}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          // The next digit always goes at the end
          onSelect={(e) => e.currentTarget.setSelectionRange(e.currentTarget.value.length, e.currentTarget.value.length)}
          className="absolute inset-0 size-full cursor-default bg-transparent text-transparent caret-transparent opacity-0 outline-none type-body-md"
        />
      </div>
      <Expand open={Boolean(error)}>
        <p id={error ? messageId : undefined} className="flex items-start gap-1.5 pt-1.5 font-medium text-coral-700 type-label">
          <WarningCircleIcon weight="fill" size={16} aria-hidden className="mt-px shrink-0" />
          <span>{error}</span>
        </p>
      </Expand>
    </div>
  );
}
