"use client";

import type { Icon } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { CheckIcon, HourglassMediumIcon } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/cn";
import { TONE, type Tone } from "./icon-circle";
import { BURST, StepBurst } from "./step-burst";

export type TileStatus = "not_started" | "in_progress" | "done";

type StatusTileProps = {
  status: TileStatus;
  // The accessible name, on the control only
  name: string;
  // Shown while not started, white in a circle of the item's section color
  icon: Icon;
  tone: Tone;
  // With this the tile is its own check control, 44 to tap. Without it, the tile only shows the status.
  onToggle?: () => void;
  // 36 on Home's Get ready, 32 in Explore's Still needed (22), 40 everywhere else
  size?: 32 | 36 | 40;
  // Counts up to play the burst from outside, as the requirement sheet's segmented control does
  burst?: number;
  // This tap finishes a checklist: the bigger burst (16 → All steps done)
  finale?: boolean;
  className?: string;
  "data-pressed"?: boolean;
  "data-focus"?: boolean;
};

const OUT = [0.2, 0.8, 0.2, 1] as const;

// A status as a circle (00 → Status tile). Not started shows its own icon in the section color, taking now an hourglass
// in a blue ring, done a white check on green. As a control it has an edge in the partner color and sinks on press.
// Turning done takes 160 ms with a burst of honey dashes; going back swaps at once. Reduced motion: colors only.
export function StatusTile({ status, name, icon: Glyph, tone, onToggle, size = 40, burst = 0, finale, className, ...data }: StatusTileProps) {
  const still = useReducedMotion();
  const done = status === "done";
  // Taps here, so a burst plays for those and never for a tile that loads as done
  const [taps, setTaps] = useState<{ n: number; big: boolean }>({ n: 0, big: false });
  const plays = taps.n + burst;
  const big = size === 40;

  const t = TONE[tone];
  const face = (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full",
        big ? "size-10" : size === 32 ? "size-8" : "size-9",
        onToggle && "edge-sm edge-face",
        done
          ? cn("bg-green-600 text-white", onToggle && "edge-green-700")
          : status === "in_progress"
            ? cn("border-[3px] border-blue-600 bg-surface text-blue-600", onToggle && "edge-blue-700")
            : cn(t.fill, t.ink, onToggle && t.edge),
      )}
    >
      <motion.span
        initial={false}
        animate={{ scale: done && !still ? [0.9, 1] : 1 }}
        transition={done && !still ? { duration: 0.16, ease: OUT } : { duration: 0 }}
        className="flex"
      >
        {done ? (
          <CheckIcon weight="bold" size={big ? 20 : size === 32 ? 16 : 18} />
        ) : status === "in_progress" ? (
          <HourglassMediumIcon weight="bold" size={big ? 20 : size === 32 ? 16 : 18} />
        ) : (
          <Glyph weight="fill" size={big ? 20 : size === 32 ? 16 : 18} />
        )}
      </motion.span>
    </span>
  );

  const dashes = done && !still && plays > 0 && <StepBurst key={plays} {...(taps.big ? BURST.finale : BURST.step)} />;

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
      {...data}
      className={cn("relative flex size-11 shrink-0 items-center justify-center rounded-full focus-ring:outline-offset-0", className)}
    >
      {face}
      {dashes}
    </button>
  );
}
