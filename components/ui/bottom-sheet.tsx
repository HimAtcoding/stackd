"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";

type BottomSheetProps = {
  open: boolean;
  // Escape and a tap on the scrim call this
  onClose: () => void;
  // id of the sheet's title, which also takes focus when the sheet opens (give it tabIndex -1)
  labelledBy: string;
  // While something inside is running, the sheet can't be dismissed
  locked?: boolean;
  children: ReactNode;
};

const EASE_OUT = [0.2, 0.8, 0.2, 1] as const;
const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

// A sheet over a scrim (00 → Bottom sheet). Slides up in 280 ms and out in 200; under reduced motion it only fades.
// Focus starts on the title, stays inside while it's open, and returns to where it was.
export function BottomSheet({ open, onClose, labelledBy, locked, children }: BottomSheetProps) {
  const sheet = useRef<HTMLDivElement>(null);
  const fadeOnly = useReducedMotion();
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const before = document.activeElement as HTMLElement | null;
    document.getElementById(labelledBy)?.focus();
    const scroll = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = scroll;
      before?.focus();
    };
  }, [open, labelledBy]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !locked) close.current();
      if (e.key !== "Tab" || !sheet.current) return;
      const items = [...sheet.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.getAttribute("aria-disabled") !== "true");
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (!first || !sheet.current.contains(active)) {
        e.preventDefault();
        first?.focus();
      } else if (e.shiftKey && (active === first || !items.includes(active as HTMLElement))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, locked]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <motion.div
            aria-hidden
            data-scrim
            className="absolute inset-0 bg-[rgba(5,16,66,.4)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              if (!locked) onClose();
            }}
          />
          <motion.div
            ref={sheet}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            className="relative w-full max-w-[480px] rounded-t-sheet bg-surface px-6 pt-6"
            style={{ paddingBottom: "calc(24px + var(--safe-bottom))" }}
            initial={fadeOnly ? { opacity: 0 } : { y: "100%" }}
            animate={fadeOnly ? { opacity: 1, transition: { duration: 0.2 } } : { y: 0, transition: { duration: 0.28, ease: EASE_OUT } }}
            exit={fadeOnly ? { opacity: 0, transition: { duration: 0.2 } } : { y: "100%", transition: { duration: 0.2, ease: EASE_OUT } }}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
