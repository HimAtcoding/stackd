"use client";

import type { ButtonHTMLAttributes } from "react";
import { CaretRightIcon } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/cn";
import { Spinner } from "./spinner";

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  "data-pressed"?: boolean;
  "data-focus"?: boolean;
};

export function PrimaryButton({ children, loading, disabled, className, onClick, ...props }: PrimaryButtonProps) {
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
        "relative flex h-14 w-full items-center justify-center rounded-full bg-blue-600 text-white shadow-cta type-button-lg",
        "transition-[background-color,transform,opacity] duration-200 ease-out",
        "pressed:bg-blue-700 pressed:duration-120 motion-safe:pressed:scale-[0.97]",
        "focus-ring:outline-offset-3",
        "disabled:opacity-40 disabled:shadow-none",
        className,
      )}
    >
      <span className={cn("transition-opacity duration-120", loading && "opacity-0")}>{children}</span>
      <CaretRightIcon
        weight="bold"
        size={20}
        aria-hidden
        className={cn("absolute right-6 top-1/2 -translate-y-1/2 transition-opacity duration-120", loading && "opacity-0")}
      />
      {loading && <Spinner className="absolute left-1/2 top-1/2 -mt-2.5 -ml-2.5" />}
    </button>
  );
}
