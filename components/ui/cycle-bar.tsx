import type { CycleBarView } from "@/lib/deadlines";
import { TimelineNode } from "./timeline-row";

const at = (n: number) => `${n * 100}%`;

// The application year on one line (15 → Cycle bar): a 6 tall track filled up to today, a node per due date and a
// marker for today, with the range's first and last month under it. No motion. Decorative: the next line and the
// timeline carry the meaning.
export function CycleBar({ view, className }: { view: CycleBarView; className?: string }) {
  return (
    <div aria-hidden className={className}>
      <div className="relative h-5">
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-blue-100">
          <div className="absolute inset-y-0 left-0 bg-blue-600" style={{ width: at(view.today) }} />
        </div>
        {view.nodes.map((n, i) => (
          <span key={i} className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: at(n.at) }}>
            <TimelineNode kind={n.kind} />
          </span>
        ))}
        <span className="absolute top-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-[1px] bg-navy-900" style={{ left: at(view.today) }} />
      </div>
      <div className="mt-1.5 flex justify-between gap-3 text-slate-600 type-caption">
        <span>{view.start}</span>
        <span>{view.end}</span>
      </div>
    </div>
  );
}
