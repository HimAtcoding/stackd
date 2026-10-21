"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type CircleButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  "aria-label": string;
  icon: ReactNode;
  // done: filled --green-600 with a white icon, e.g. the editor's Mark done once the answer is done (17)
  variant?: "surface" | "plus" | "done";
  "data-pressed"?: boolean;
  "data-focus"?: boolean;
};

// 44 circle for back, save, bell. The "plus" variant is the blue new-essay button.
export function CircleButton({ icon, variant = "surface", className, ...props }: CircleButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "flex size-11 items-center justify-center rounded-full transition-transform duration-200 ease-out",
        "pressed:duration-120 motion-safe:pressed:scale-[0.94]",
        variant === "plus"
          ? "bg-blue-600 text-white shadow-cta focus-ring:outline-offset-3"
          : variant === "done"
            ? "bg-green-600 text-white shadow-float"
            : "bg-surface text-navy-900 shadow-float",
        className,
      )}
    >
      {icon}
    </button>
  );
}
