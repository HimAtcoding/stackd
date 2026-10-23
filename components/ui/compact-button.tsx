"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type CompactButtonProps = {
  children: ReactNode;
  // Optional: Finish review on the reviewer page has none (20 → 6)
  icon?: ReactNode;
  onClick: () => void;
  // solid: the compact solid button. text: the text button, no fill or border (16 → Additions to 00).
  variant: "solid" | "text";
  "aria-label"?: string;
};

// A small action for the open timeline row. Both look 36 tall and reach 44 above and below the visible part.
// Solid: --blue-600 fill, white icon 16 + 6 + label. Text: icon 16 + 6 + label in --blue-700.
export function CompactButton({ children, icon, onClick, variant, ...rest }: CompactButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      {...rest}
      className={cn(
        "relative inline-flex h-9 items-center gap-1.5 rounded-full type-label after:absolute after:inset-x-0 after:-inset-y-1 after:content-['']",
        variant === "solid"
          ? "bg-blue-600 px-3.5 text-white transition-[background-color,transform] duration-200 ease-out pressed:bg-blue-700 pressed:duration-120 motion-safe:pressed:scale-[0.98]"
          : "px-1 text-blue-700 pressed:underline focus-ring:underline",
      )}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}
