import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type AskCardProps = {
  // id of the card's title
  labelledBy: string;
  // Inline at the left, 24, in --blue-600
  icon: ReactNode;
  className?: string;
  children: ReactNode;
};

// Tier 3, the ask (15 → Reminders ask): tinted fill and border, no shadow, no icon tile. Asks the student for one thing.
export function AskCard({ labelledBy, icon, className, children }: AskCardProps) {
  return (
    <section aria-labelledby={labelledBy} className={cn("relative flex gap-3 rounded-md border border-blue-50-border bg-blue-50 p-4", className)}>
      <span className="shrink-0 text-blue-600">{icon}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </section>
  );
}
