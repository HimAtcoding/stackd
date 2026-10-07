import { CheckIcon } from "@phosphor-icons/react/ssr";
import { Card } from "@/components/ui/card";
import type { RequirementStatus } from "@/lib/seed";

// All steps as circles on a pale track, with green filled to the last done circle in the run from the start.
export function JourneyCard({ statuses }: { statuses: RequirementStatus[] }) {
  const total = statuses.length;
  const done = statuses.filter((s) => s === "done").length;
  // Done circles in a row from the start; the fill stops at the last of them
  const firstOpen = statuses.findIndex((s) => s !== "done");
  const run = firstOpen === -1 ? total : firstOpen;
  // Circle center to circle center: the row width minus one circle, split into (total - 1) gaps
  const pitch = `(100% - 30px) / ${Math.max(total - 1, 1)}`;

  return (
    <Card className="relative z-10">
      {/* Grows if the title wraps (320 wide), so it never runs into the circles */}
      <div className="flex min-h-6.5 items-baseline justify-between gap-3">
        <h2 className="text-navy-900 type-title-2">Your transfer journey</h2>
        <p className="shrink-0 text-navy-900 tabular-nums type-caption">
          {done} of {total} complete
        </p>
      </div>
      <div role="img" aria-label={`${done} of ${total} steps complete`} className="relative mt-3 h-7.5">
        {/* Track and fill share the circles' center line: 6 tall at top 12 in a 30 row. Square ends: each one is under a circle */}
        <span data-track className="absolute inset-x-[15px] top-3 h-1.5 bg-node-empty" />
        {run > 1 && (
          <span
            data-fill
            className="absolute left-[15px] top-3 h-1.5 bg-green-600"
            style={{ width: `calc(${run - 1} * ${pitch})` }}
          />
        )}
        <span className="relative flex h-full justify-between">
          {statuses.map((s, i) => (
            <span
              key={i}
              data-node={s === "done" ? "done" : "remaining"}
              className={`flex size-7.5 items-center justify-center rounded-full ${s === "done" ? "bg-green-600" : "bg-node-empty"}`}
            >
              {s === "done" && <CheckIcon weight="bold" size={16} className="text-white" />}
            </span>
          ))}
        </span>
      </div>
    </Card>
  );
}
