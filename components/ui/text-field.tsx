"use client";

import type { InputHTMLAttributes, ReactNode, Ref } from "react";
import { WarningCircleIcon } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/cn";
import { Expand } from "./expand";

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  id: string;
  // Without a label (the search field), pass aria-label
  label?: string;
  icon?: ReactNode;
  // A 44 × 44 control at the right edge, e.g. show/hide password.
  trailing?: ReactNode;
  hint?: string;
  error?: string;
  ref?: Ref<HTMLInputElement>;
  "data-focus"?: boolean;
};

export function TextField({ id, label, icon, trailing, hint, error, className, disabled, readOnly, ref, ...inputProps }: TextFieldProps) {
  const messageId = `${id}-message`;
  const hasMessage = Boolean(error || hint);

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-navy-900 type-headline">
          {label}
        </label>
      )}
      <div className={cn("relative", label && "mt-2", readOnly && "opacity-60", disabled && "opacity-40")}>
        {icon && (
          <span aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 flex -translate-y-1/2 text-slate-600">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={error ? true : undefined}
          aria-describedby={hasMessage ? messageId : undefined}
          {...inputProps}
          className={cn(
            "block h-12 w-full rounded-sm border bg-surface px-4 text-navy-900 caret-blue-600 outline-none type-body-md placeholder:text-slate-600",
            "transition-[border-color,box-shadow] duration-120 ease-out",
            Boolean(icon) && "pl-13",
            Boolean(trailing) && "pr-12",
            error
              ? "border-coral-700 shadow-[inset_0_0_0_1px_var(--coral-700)] field-focus:shadow-[inset_0_0_0_1px_var(--coral-700),0_0_0_4px_rgba(3,100,250,.15)]"
              : "border-field-border field-focus:border-blue-600 field-focus:shadow-[inset_0_0_0_1px_var(--blue-600),0_0_0_4px_rgba(3,100,250,.15)]",
          )}
        />
        {trailing && <span className="absolute right-0.5 top-1/2 flex -translate-y-1/2">{trailing}</span>}
      </div>
      {hint ? (
        // With a hint the line is always there; a failed check swaps the hint for the error.
        <p
          id={messageId}
          className={cn("flex items-start gap-1.5 pt-1.5 type-label", error ? "font-medium text-coral-700" : "font-normal text-slate-600")}
        >
          {error && <WarningCircleIcon weight="fill" size={16} aria-hidden className="mt-px shrink-0" />}
          <span>{error ?? hint}</span>
        </p>
      ) : (
        <Expand open={Boolean(error)}>
          <p id={error ? messageId : undefined} className="flex items-start gap-1.5 pt-1.5 text-coral-700 type-label font-medium">
            <WarningCircleIcon weight="fill" size={16} aria-hidden className="mt-px shrink-0" />
            <span>{error}</span>
          </p>
        </Expand>
      )}
    </div>
  );
}
