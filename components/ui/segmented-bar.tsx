import { cn } from "@/lib/cn";

type SegmentedBarProps = {
  // True when done, "taking" when taking now (honey)
  steps: (boolean | "taking")[];
  // On a hero: done white, taking now honey, not yet the hero's partner color (--partner, set by Hero)
  onFill?: boolean;
  // 4 tall instead of 10, 2 apart: the 60-wide mini bar in a major row (22 → 3)
  thin?: boolean;
  className?: string;
};

const look = (step: SegmentedBarProps["steps"][number], onFill?: boolean) => {
  if (onFill) return step === "taking" ? "bg-yellow-400" : step ? "bg-white" : "bg-(--partner)";
  return step === "taking" ? "bg-yellow-400" : step ? "bg-green-600" : "bg-border";
};

// One segment per step, so the bar counts real steps (15 → Get ready). A segment turns green over 200 ms when its
// step is checked. Decorative: the count next to the title carries it.
export function SegmentedBar({ steps, onFill, thin, className }: SegmentedBarProps) {
  return (
    <div aria-hidden className={cn("flex", thin ? "gap-0.5" : "gap-[5px]", className)}>
      {steps.map((done, i) => (
        <span
          key={i}
          className={cn(thin ? "h-1" : "h-2.5", "flex-1 rounded-full transition-colors duration-200 ease-out motion-reduce:transition-none", look(done, onFill))}
        />
      ))}
    </div>
  );
}
