"use client";

import { useRef } from "react";
import { MagnifyingGlassIcon, XCircleIcon } from "@phosphor-icons/react/ssr";
import { TextField } from "./text-field";

type SearchFieldProps = {
  id: string;
  // Also the field's accessible name, since it has no label
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  className?: string;
  "data-focus"?: boolean;
};

// The text field without a label, with a magnifying glass and, once there's text, a clear button (10 → Search).
export function SearchField({ id, placeholder, value, onChange, readOnly, className, ...data }: SearchFieldProps) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <TextField
      ref={ref}
      id={id}
      type="search"
      aria-label={placeholder}
      placeholder={placeholder}
      enterKeyHint="search"
      autoCapitalize="off"
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      className={className}
      icon={<MagnifyingGlassIcon size={22} />}
      value={value}
      readOnly={readOnly}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        // The list filters as you type, so Search on the keyboard only puts the keyboard away
        if (e.key === "Enter") e.currentTarget.blur();
      }}
      trailing={
        value && !readOnly ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              onChange("");
              ref.current?.focus();
            }}
            className="flex size-11 items-center justify-center rounded-sm text-slate-600"
          >
            <XCircleIcon weight="fill" size={20} aria-hidden />
          </button>
        ) : undefined
      }
      {...data}
    />
  );
}
