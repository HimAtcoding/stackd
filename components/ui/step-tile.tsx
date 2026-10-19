"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { CheckIcon } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/cn";
import { stepLook } from "@/lib/step-icons";

type StepTileProps = {
  // The step's title: its accessible name, and what picks its icon
  title: string;
  done: boolean;
  onToggle: () => void;
  // 36 on Home's Get ready, 40 in the steps sheet. The hit area is 44 either way.
  size?: 36 | 40;
  // Checking this one finishes the checklist for the first time on this device: the bigger burst (16 → All steps done)
  finale?: boolean;
  className?: string;
};

const OUT = [0.2, 0.8, 0.2, 1] as const;
// Six dashes reaching 28 for a step; ten reaching 40 for the step that finishes the checklist
const BURST = { step: { count: 6, reach: 28 }, finale: { count: 10, reach: 40 } };

// A checklist step's icon tile, which is also its check control (16 → Step icons). Checking turns it green over
// 160 ms with a burst of yellow dashes; unchecking swaps back at once. Reduced motion: colors only.
export function StepTile({ title, done, onToggle, size = 36, finale, className }: StepTileProps) {
  const still = useReducedMotion();
  const { icon: Icon, tile, color } = stepLook(title);
  // Checks made here, so a burst plays for those and never for a step that loads as done
  const [burst, setBurst] = useState<{ n: number; big: boolean }>({ n: 0, big: false });
  const { count, reach } = burst.big ? BURST.finale : BURST.step;

  function toggle() {
    if (!done && !still) setBurst((b) => ({ n: b.n + 1, big: Boolean(finale) }));
    onToggle();
  }

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={title}
      onClick={toggle}
      className={cn("relative flex size-11 shrink-0 items-center justify-center rounded-sm", className)}
    >
      <motion.span
        aria-hidden
        initial={false}
        animate={{ scale: done && !still ? [0.9, 1] : 1 }}
        transition={done && !still ? { duration: 0.16, ease: OUT } : { duration: 0 }}
        className={cn(
          "flex items-center justify-center rounded-sm",
          size === 40 ? "size-10" : "size-9",
          done ? "bg-green-600 text-white transition-colors duration-160 ease-out motion-reduce:transition-none" : `${tile} ${color}`,
        )}
      >
        {done ? <CheckIcon weight="bold" size={size === 40 ? 20 : 18} /> : <Icon weight="duotone" size={size === 40 ? 22 : 20} />}
      </motion.span>
      {done && burst.n > 0 && (
        <span key={burst.n} aria-hidden className="pointer-events-none absolute left-1/2 top-1/2">
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
      )}
    </button>
  );
}
