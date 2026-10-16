"use client";

import { cn } from "@/lib/cn";

type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  disabled?: boolean;
  "data-focus"?: boolean;
};

// 51 × 31 switch (14 → Additions to 00). The 27 knob slides 20 over 200 ms.
export function Switch({ checked, onChange, disabled, ...rest }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled || undefined}
      onClick={() => {
        if (!disabled) onChange(!checked);
      }}
      {...rest}
      className={cn(
        "relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-200 ease-out",
        checked ? "bg-blue-600" : "bg-slate-400",
        disabled && "opacity-40",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute left-0.5 top-0.5 size-[27px] rounded-full bg-white shadow-float transition-transform duration-200 ease-out",
          checked && "translate-x-5",
        )}
      />
    </button>
  );
}
