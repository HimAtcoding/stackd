"use client";

import type { Icon } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { CheckIcon, HourglassMediumIcon } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/cn";

export type TileStatus = "not_started" | "in_progress" | "done";

type StatusTileProps = {
  status: TileStatus;
  // The accessible name, on the control only
  name: string;
  // Shown while not started, on its own tint
  icon: Icon;
  tile: string;
  color: string;
  // With this the tile is its own check control, 44 to tap. Without it, the tile only shows the status.
  onToggle?: () => void;
  // 36 on Home's Get ready, 40 everywhere else
  size?: 36 | 40;
  // Counts up to play the burst from outside, as the requirement sheet's segmented control does
  burst?: number;
  // This tap finishes a checklist: the bigger burst (16 → All steps done)
  finale?: boolean;
  className?: string;
};

const OUT = [0.2, 0.8, 0.2, 1] as const;
// Six dashes reaching 28 for a step; ten reaching 40 for the step that finishes the checklist
const BURST = { step: { count: 6, reach: 28 }, finale: { count: 10, reach: 40 } };

// A status as an icon tile (16 → Step icons, 21 → Status tile). Not started shows its own icon, taking now an hourglass
// on sky, done a white check on green. Turning done takes 160 ms with a burst of yellow dashes; going back swaps at once.
// Reduced motion: colors only.
export function StatusTile({ status, name, icon: Glyph, tile, color, onToggle, size = 40, burst = 0, finale, className }: StatusTileProps) {
  const still = useReducedMotion();
  const done = status === "done";
  // Taps here, so a burst plays for those and never for a tile that loads as done
  const [taps, setTaps] = useState<{ n: number; big: boolean }>({ n: 0, big: false });
  const { count, reach } = taps.big ? BURST.finale : BURST.step;
  const plays = taps.n + burst;
  const big = size === 40;

  const face = (
    <motion.span
      aria-hidden
      initial={false}
      animate={{ scale: done && !still ? [0.9, 1] : 1 }}
      transition={done && !still ? { duration: 0.16, ease: OUT } : { duration: 0 }}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-sm",
        big ? "size-10" : "size-9",
        done
          ? "bg-green-600 text-white transition-colors duration-160 ease-out motion-reduce:transition-none"
          : status === "in_progress"
            ? "bg-tint-sky text-blue-600"
            : `${tile} ${color}`,
      )}
    >
      {done ? (
        <CheckIcon weight="bold" size={big ? 20 : 18} />
      ) : status === "in_progress" ? (
        <HourglassMediumIcon weight="duotone" size={big ? 22 : 20} />
      ) : (
        <Glyph weight="duotone" size={big ? 22 : 20} />
      )}
    </motion.span>
  );

  const dashes = done && !still && plays > 0 && (
    <span key={plays} aria-hidden className="pointer-events-none absolute left-1/2 top-1/2">
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

  if (!onToggle) {
    return (
      <span aria-hidden className={cn("relative flex shrink-0", className)}>
        {face}
        {dashes}
      </span>
    );
  }

  function toggle() {
    if (!done && !still) setTaps((t) => ({ n: t.n + 1, big: Boolean(finale) }));
    onToggle?.();
  }

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done ? true : status === "in_progress" ? "mixed" : false}
      aria-label={name}
      onClick={toggle}
      className={cn("relative flex size-11 shrink-0 items-center justify-center rounded-sm", className)}
    >
      {face}
      {dashes}
    </button>
  );
}
