import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

// The section colors (00 → Section colors), each with its edge partner. Green means Explore here, never "done".
export type Tone = "blue" | "green" | "indigo" | "amber" | "yellow" | "coral";

export const TONE: Record<Tone, { fill: string; edge: string; partner: string; ink: string }> = {
  blue: { fill: "bg-blue-600", edge: "edge-blue-700", partner: "var(--blue-700)", ink: "text-white" },
  green: { fill: "bg-green-700", edge: "edge-green-800", partner: "var(--green-800)", ink: "text-white" },
  indigo: { fill: "bg-indigo-600", edge: "edge-indigo-800", partner: "var(--indigo-800)", ink: "text-white" },
  amber: { fill: "bg-amber-700", edge: "edge-amber-800", partner: "var(--amber-800)", ink: "text-white" },
  yellow: { fill: "bg-yellow-400", edge: "edge-yellow-700", partner: "var(--yellow-700)", ink: "text-navy-900" },
  coral: { fill: "bg-coral-700", edge: "edge-coral-800", partner: "var(--coral-800)", ink: "text-white" },
};

type IconCircleProps = {
  tone: Tone;
  // A fill icon at 22 (20 in a 40 circle); it takes the circle's ink color
  children: ReactNode;
  // 36 only where a row keeps a 36 slot (the essays' required question)
  size?: 36 | 40 | 44;
  // The circle is a control (the step check): it gets its edge. Otherwise flat.
  control?: boolean;
  className?: string;
};

// Replaces rev 1's pale icon tiles: a solid circle in the section color, white icon (navy on honey)
export function IconCircle({ tone, children, size = 44, control, className }: IconCircleProps) {
  const t = TONE[tone];
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full",
        size === 44 ? "size-11" : size === 40 ? "size-10" : "size-9",
        t.fill,
        t.ink,
        control && cn("edge-sm edge-face", t.edge),
        className,
      )}
    >
      {children}
    </span>
  );
}
