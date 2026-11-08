"use client";

import { useEffect } from "react";

const CONTROL = 'a, button, label, [role="button"], [role="checkbox"]';

// iOS Safari doesn't apply :active reliably, so a control also gets data-pressed from pointerdown to pointerup or
// cancel (a scroll cancels it). Only the attribute set here is removed, so /dev/components keeps its forced states.
export function TouchActive() {
  useEffect(() => {
    let held: Element | null = null;
    const release = () => {
      held?.removeAttribute("data-pressed");
      held = null;
    };
    const press = (e: PointerEvent) => {
      if (!e.isPrimary || e.button !== 0) return;
      release();
      const el = e.target instanceof Element ? e.target.closest(CONTROL) : null;
      if (!el || el.hasAttribute("data-pressed") || el.matches(':disabled, [aria-disabled="true"]')) return;
      el.setAttribute("data-pressed", "");
      held = el;
    };
    const noop = () => {};
    document.addEventListener("touchstart", noop, { passive: true });
    document.addEventListener("pointerdown", press, { passive: true });
    document.addEventListener("pointerup", release, { passive: true });
    document.addEventListener("pointercancel", release, { passive: true });
    window.addEventListener("blur", release);
    return () => {
      document.removeEventListener("touchstart", noop);
      document.removeEventListener("pointerdown", press);
      document.removeEventListener("pointerup", release);
      document.removeEventListener("pointercancel", release);
      window.removeEventListener("blur", release);
    };
  }, []);
  return null;
}
