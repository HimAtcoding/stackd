"use client";

import { motion } from "motion/react";

const OUT = [0.2, 0.8, 0.2, 1] as const;

// Six dashes reaching 28 for a step; ten reaching 40 for the step that finishes the checklist
export const BURST = { step: { count: 6, reach: 28 }, finale: { count: 10, reach: 40 } };

// The step burst (16): honey dashes flying out from the center of a step that was just checked. The caller skips it
// under reduced motion and remounts it (a new key) to play it again.
export function StepBurst({ count, reach }: { count: number; reach: number }) {
  return (
    <span aria-hidden className="pointer-events-none absolute left-1/2 top-1/2">
      {Array.from({ length: count }, (_, i) => (i * 360) / count).map((angle) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <motion.span
            key={angle}
            initial={{ x: 0, y: 0, opacity: 1 }}
            animate={{ x: Math.cos(rad) * reach, y: Math.sin(rad) * reach, opacity: 0 }}
            transition={{ duration: 0.36, ease: OUT }}
            className="absolute -left-[1.5px] -top-1 h-2 w-[3px] rounded-[2px] bg-yellow-400"
            style={{ rotate: angle + 90 }}
          />
        );
      })}
    </span>
  );
}
