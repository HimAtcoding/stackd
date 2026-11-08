"use client";

import { stepLook } from "@/lib/step-icons";
import { StatusTile } from "./status-tile";

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

// A checklist step's icon tile, which is also its check control (16 → Step icons)
export function StepTile({ title, done, onToggle, size = 36, finale, className }: StepTileProps) {
  return <StatusTile {...stepLook(title)} name={title} status={done ? "done" : "not_started"} onToggle={onToggle} size={size} finale={finale} className={className} />;
}

// The same tile at 40 without the control, for the step sheet's header (18 → Step sheets). Green with a check when done.
export function StepIconTile({ title, done, className }: { title: string; done: boolean; className?: string }) {
  return <StatusTile {...stepLook(title)} name={title} status={done ? "done" : "not_started"} className={className} />;
}
