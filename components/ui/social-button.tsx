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

// Logo, 16 gap, label. While pending, a navy spinner takes the logo's place and the label stays.
export function SocialButton({ logo, loading, children, disabled, className, ...props }: SocialButtonProps) {
  return (
    <button
      type="button"
      {...props}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      aria-busy={loading || undefined}
      className={cn(
        "flex h-12 w-full items-center justify-center gap-4 rounded-sm border border-border-strong bg-surface text-navy-900 type-button",
        "transition-[background-color,transform,opacity] duration-200 ease-out",
        "pressed:bg-surface-pressed pressed:duration-120 motion-safe:pressed:scale-[0.98]",
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
