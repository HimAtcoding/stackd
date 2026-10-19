import { cn } from "@/lib/cn";

// One segment per step, so the bar counts real steps (15 → Get ready). A segment turns green over 200 ms when its
// step is checked. Decorative: the count next to the title carries it.
export function SegmentedBar({ steps, className }: { steps: boolean[]; className?: string }) {
  return (
    <div aria-hidden className={cn("flex gap-1", className)}>
      {steps.map((done, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 flex-1 rounded-full transition-colors duration-200 ease-out motion-reduce:transition-none",
            done ? "bg-green-600" : "bg-blue-100",
          )}
        />
      ))}
    </div>
  );
}
