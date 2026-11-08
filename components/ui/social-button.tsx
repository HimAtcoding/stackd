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
// It sinks into its --border-strong edge on press. While pending, a navy spinner takes the logo's place and the
// label stays.
export function SocialButton({ logo, loading, children, disabled, className, ...props }: SocialButtonProps) {
  return (
    <button
      type="button"
      {...props}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      aria-busy={loading || undefined}
      className={cn(
        "relative flex h-13 w-full items-center justify-center gap-3 rounded-md border-2 border-border-strong bg-white text-navy-900 type-button edge-sm edge-border-strong",
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
