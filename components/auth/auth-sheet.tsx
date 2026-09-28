"use client";

import type { FocusEvent, FormHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

// Keeps the focused field above the on-screen keyboard.
function keepFieldInView(e: FocusEvent<HTMLElement>) {
  const field = e.target;
  if (!(field instanceof HTMLInputElement)) return;
  setTimeout(() => {
    const vv = window.visualViewport;
    if (!vv || document.activeElement !== field) return;
    const r = field.getBoundingClientRect();
    if (r.bottom > vv.offsetTop + vv.height || r.top < vv.offsetTop) field.scrollIntoView({ block: "center" });
  }, 300);
}

// The white sheet: 16 in from each screen edge, radius 20 on top, content at x 32, runs to the bottom.
export function AuthSheet({ className, children, ...props }: FormHTMLAttributes<HTMLFormElement>) {
  return (
    <form
      noValidate
      onFocus={keepFieldInView}
      {...props}
      className={cn(
        "relative z-[1] mx-4 flex flex-1 flex-col rounded-t-lg bg-surface px-4 pt-5 shadow-[0_-8px_24px_rgba(5,16,66,.06)]",
        className,
      )}
      style={{ paddingBottom: "calc(16px + var(--safe-bottom))" }}
    >
      {children}
    </form>
  );
}
