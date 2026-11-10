"use client";

import { stepLook } from "@/lib/step-icons";
import { StatusTile } from "./status-tile";

// A step's icon circle at 40 without the control, for the step sheet's header (18 → Step sheets). Green with a check
// when done. On Home the step path draws the steps (00 → Step path).
export function StepIconTile({ title, done, className }: { title: string; done: boolean; className?: string }) {
  return <StatusTile {...stepLook(title)} name={title} status={done ? "done" : "not_started"} className={className} />;
}
