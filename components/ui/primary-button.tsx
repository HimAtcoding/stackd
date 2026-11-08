"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "./spinner";

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  // On a blue hero: white fill, blue label, the same --blue-700 edge (00 → Primary button)
  onHero?: boolean;
  "data-pressed"?: boolean;
  "data-focus"?: boolean;
};

// 56 tall, --r-md, blue with its --blue-700 edge. No chevron in rev 2.
export function PrimaryButton({ children, loading, onHero, disabled, className, onClick, ...props }: PrimaryButtonProps) {
  return (
    <button
      type="button"
      {...props}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      aria-busy={loading || undefined}
      onClick={(e) => {
        if (loading) {
          e.preventDefault();
          return;
        }
        onClick?.(e);
      }}
      className={cn(
        "relative flex h-14 w-full items-center justify-center rounded-md px-5 type-button-lg edge-md edge-blue-700",
        onHero ? "bg-white text-blue-600" : "bg-blue-600 text-white",
        "focus-ring:outline-offset-3",
        "disabled:bg-border disabled:text-slate-600 disabled:[box-shadow:none]",
        className,
      )}
    >
      <span className={cn("transition-opacity duration-120", loading && "opacity-0")}>{children}</span>
      {loading && <Spinner className={cn("absolute left-1/2 top-1/2 -mt-2.5 -ml-2.5", onHero && "text-blue-600")} />}
    </button>
  );
}
