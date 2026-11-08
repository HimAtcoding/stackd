import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconCircle } from "./icon-circle";

type AskCardProps = {
  // id of the card's title
  labelledBy: string;
  // A fill icon at 20, set in a honey circle at the left
  icon: ReactNode;
  className?: string;
  children: ReactNode;
};

// Tier 3, the ask (00 → Ask card): a passive card with a honey icon circle and its own button. Asks for one thing.
export function AskCard({ labelledBy, icon, className, children }: AskCardProps) {
  return (
    <section aria-labelledby={labelledBy} className={cn("relative flex gap-3 rounded-lg border-2 border-border bg-surface p-4", className)}>
      <IconCircle tone="yellow" size={40}>
        {icon}
      </IconCircle>
      <div className="min-w-0 flex-1">{children}</div>
    </section>
  );
}
