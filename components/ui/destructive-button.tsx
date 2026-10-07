"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "./spinner";

type DestructiveButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  "data-pressed"?: boolean;
  "data-focus"?: boolean;
};

// The primary button's shape in coral, with no chevron and no shadow. Only for deleting the account (11).
export function DestructiveButton({ children, loading, className, onClick, ...props }: DestructiveButtonProps) {
  return (
    <button
      type="button"
      {...props}
      aria-busy={loading || undefined}
      onClick={(e) => {
        if (loading) {
          e.preventDefault();
          return;
        }
        onClick?.(e);
      }}
      className={cn(
        "relative flex h-14 w-full items-center justify-center rounded-full bg-coral-700 text-white type-button-lg",
        "transition-transform duration-200 ease-out",
        // Pressed: darkened with a 12% black layer over the coral
        "pressed:bg-[linear-gradient(rgba(0,0,0,.12),rgba(0,0,0,.12))] pressed:duration-120 motion-safe:pressed:scale-[0.97]",
        "focus-ring:outline-offset-3",
        className,
      )}
    >
      <span className={cn("transition-opacity duration-120", loading && "opacity-0")}>{children}</span>
      {loading && <Spinner className="absolute left-1/2 top-1/2 -mt-2.5 -ml-2.5" />}
    </button>
  );
}
