import { cn } from "@/lib/cn";

type WindowBarProps = {
  // How much of the filing window is gone, 0 to 1. Null before it opens: track only.
  progress: number | null;
  // 14 days or less left
  soon: boolean;
  start: string;
  end: string;
  // On the solid Up next hero (16): white track and fill, a yellow today marker, white labels
  onFill?: boolean;
  className?: string;
};

// A filing window as a 6 tall bar that fills as time passes, with a marker for today (14 → The stack).
// Decorative: the card's words carry the dates. It never animates on load.
export function WindowBar({ progress, soon, start, end, onFill, className }: WindowBarProps) {
  const at = progress === null ? null : `${progress * 100}%`;
  return (
    <div aria-hidden className={className}>
      <div className={cn("relative h-1.5 rounded-full", onFill ? "bg-white/28" : "bg-blue-100")}>
        {at && (
          <>
            <div
              className={cn("absolute inset-y-0 left-0 rounded-full", onFill ? "bg-white" : soon ? "bg-coral-500" : "bg-blue-600")}
              style={{ width: at }}
            />
            <div
              className={cn("absolute top-1/2 h-3.5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-[1px]", onFill ? "bg-yellow-400" : "bg-navy-900")}
              style={{ left: at }}
            />
          </>
        )}
      </div>
      <div className={cn("mt-1.5 flex justify-between gap-3 type-caption", onFill ? "text-white" : "text-slate-600")}>
        <span>{start}</span>
        <span>{end}</span>
      </div>
    </div>
  );
}
