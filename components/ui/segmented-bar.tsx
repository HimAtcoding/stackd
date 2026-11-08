import { cn } from "@/lib/cn";

type SegmentedBarProps = {
  // True when done. "taking" shows only on a solid panel; elsewhere the sentence beside the bar carries it (21).
  steps: (boolean | "taking")[];
  // On a solid panel (21): done white, taking now yellow, not yet white at 28%
  onFill?: boolean;
  className?: string;
};

const look = (step: SegmentedBarProps["steps"][number], onFill?: boolean) => {
  if (onFill) return step === "taking" ? "bg-yellow-400" : step ? "bg-white" : "bg-white/28";
  return step === true ? "bg-green-600" : "bg-blue-100";
};

// One segment per step, so the bar counts real steps (15 → Get ready). A segment turns green over 200 ms when its
// step is checked. Decorative: the count next to the title carries it.
export function SegmentedBar({ steps, onFill, className }: SegmentedBarProps) {
  return (
    <div aria-hidden className={cn("flex gap-1", className)}>
      {steps.map((done, i) => (
        <span
          key={i}
          className={cn("h-1.5 flex-1 rounded-full transition-colors duration-200 ease-out motion-reduce:transition-none", look(done, onFill))}
        />
      ))}
    </div>
  );
}
