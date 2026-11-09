import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type PillVariant = "due" | "soon" | "good" | "neutral";

const LOOK: Record<PillVariant, string> = {
  due: "bg-coral-50 text-coral-700",
  soon: "bg-yellow-50 text-amber-900",
  good: "bg-mint-100 text-mint-800",
  neutral: "bg-surface-pressed text-slate-700",
};

// A label, not a control: 28 tall, radius 10, no edge (00 → Pill)
export function Pill({ variant, children, className }: { variant: PillVariant; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex h-7 items-center whitespace-nowrap rounded-[10px] px-2.5 tabular-nums type-pill", LOOK[variant], className)}>
      {children}
    </span>
  );
}
