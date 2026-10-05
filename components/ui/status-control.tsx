"use client";

import { MotionConfig, motion } from "motion/react";
import { cn } from "@/lib/cn";
import { StatusIcon } from "./status-icon";

type StatusControlProps = {
  done: boolean;
  // The ring shown while not done.
  restStatus: "in_progress" | "not_started";
  // "Mark {title} complete"
  label: string;
  onToggle: () => void;
  className?: string;
};

const BOUNCY = { type: "spring", stiffness: 260, damping: 16 } as const;
const OUT = { duration: 0.12, ease: [0.2, 0.8, 0.2, 1] } as const;

// The status icon as a checkbox, 44 × 44 around the 28 icon (03 → Status control).
// To done: ring fades out over 120, the fill springs 0.6 → 1, the check draws over 180. Back: all reversed in 120.
export function StatusControl({ done, restStatus, label, onToggle, className }: StatusControlProps) {
  return (
    <MotionConfig reducedMotion="user">
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={label}
        onClick={onToggle}
        className={cn("flex size-11 items-center justify-center rounded-full", className)}
      >
        <span aria-hidden className="relative size-7">
          <motion.span initial={false} animate={{ opacity: done ? 0 : 1 }} transition={OUT} className="absolute inset-0">
            <StatusIcon status={restStatus} />
          </motion.span>
          <motion.span
            initial={false}
            animate={done ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 }}
            transition={done ? { opacity: OUT, scale: BOUNCY } : OUT}
            className="absolute inset-0 rounded-full bg-green-600"
          />
          <svg viewBox="0 0 28 28" className="absolute inset-0 size-7">
            <motion.path
              d="M9 14.5 12.5 18 19 10.5"
              fill="none"
              stroke="white"
              strokeWidth={2.25}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={false}
              animate={{ pathLength: done ? 1 : 0, opacity: done ? 1 : 0 }}
              transition={done ? { pathLength: { duration: 0.18, ease: "easeOut" }, opacity: { duration: 0.01 } } : OUT}
            />
          </svg>
        </span>
      </button>
    </MotionConfig>
  );
}
