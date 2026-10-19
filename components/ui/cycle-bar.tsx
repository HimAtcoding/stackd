import { cn } from "@/lib/cn";
import type { CycleBarNode, CycleBarView } from "@/lib/deadlines";
import { TimelineNode } from "./timeline-row";

const at = (n: number) => `${n * 100}%`;

type Panel = "blue" | "coral";

// A date's node on the Deadlines panel (16 → Deadlines panel): 14 days or less, a filled white dot; open, a white
// ring with the panel's color inside; not open yet, a fainter white ring.
function PanelNode({ kind, panel }: { kind: CycleBarNode["kind"]; panel: Panel }) {
  const inside = panel === "coral" ? "bg-coral-700" : "bg-blue-600";
  return (
    <span
      className={cn(
        "block size-3 rounded-full",
        kind === "soon" && "bg-white",
        kind === "open" && `border-[2.5px] border-white ${inside}`,
        kind === "later" && `border-2 border-white/60 ${inside}`,
      )}
    />
  );
}

// The application year on one line (15 → Cycle bar): a 6 tall track filled up to today, a node per due date and a
// marker for today, with the range's first and last month under it. On the Deadlines panel (`panel`), it's drawn
// in white like Home's window bar, with a yellow today marker. No motion. Decorative: the next line and the
// timeline carry the meaning.
export function CycleBar({ view, panel, className }: { view: CycleBarView; panel?: Panel; className?: string }) {
  return (
    <div aria-hidden className={className}>
      <div className="relative h-5">
        <div className={cn("absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full", panel ? "bg-white/28" : "bg-blue-100")}>
          <div className={cn("absolute inset-y-0 left-0", panel ? "bg-white" : "bg-blue-600")} style={{ width: at(view.today) }} />
        </div>
        {view.nodes.map((n, i) => (
          <span key={i} className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: at(n.at) }}>
            {panel ? <PanelNode kind={n.kind} panel={panel} /> : <TimelineNode kind={n.kind} />}
          </span>
        ))}
        <span
          className={cn("absolute top-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-[1px]", panel ? "bg-yellow-400" : "bg-navy-900")}
          style={{ left: at(view.today) }}
        />
      </div>
      <div className={cn("mt-1.5 flex justify-between gap-3 type-caption", panel ? "text-white" : "text-slate-600")}>
        <span>{view.start}</span>
        <span>{view.end}</span>
      </div>
    </div>
  );
}
