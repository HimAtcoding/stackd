"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "./spinner";

type SocialButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  logo: ReactNode;
  loading?: boolean;
  "data-pressed"?: boolean;
  "data-focus"?: boolean;
};

// White, because Apple and Google both require their logo on white. Logo, 12 gap, label.
// Pressed tints the whole button through a multiply overlay, so the logo's white box tints with it
// and the label stays dark. While pending, a navy spinner takes the logo's place and the label stays.
export function SocialButton({ logo, loading, children, disabled, className, ...props }: SocialButtonProps) {
  return (
    <button
      type="button"
      {...props}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      aria-busy={loading || undefined}
      className={cn(
        "relative flex h-12 w-full items-center justify-center gap-3 overflow-hidden rounded-sm border border-border-strong bg-white text-navy-900 type-button",
        "transition-[transform,opacity] duration-200 ease-out pressed:duration-120 motion-safe:pressed:scale-[0.98]",
        "after:pointer-events-none after:absolute after:inset-0 after:bg-surface-pressed after:opacity-0 after:mix-blend-multiply after:transition-opacity after:duration-200",
        "pressed:after:opacity-60 pressed:after:duration-120",
        "disabled:opacity-40",
        className,
      )}
    >
      <span className="relative flex items-center justify-center">
        <span className={cn("flex", loading && "invisible")}>{logo}</span>
        {loading && <Spinner className="absolute left-1/2 top-1/2 -mt-2.5 -ml-2.5 text-navy-900" />}
      </span>
      <span>{children}</span>
    </button>
  );
}
