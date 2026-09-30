import { CheckIcon } from "@phosphor-icons/react/ssr";
import { Card } from "@/components/ui/card";
import type { RequirementStatus } from "@/lib/seed";

// Six nodes spread across the card. A green bar joins two done nodes in a row.
export function JourneyCard({ statuses }: { statuses: RequirementStatus[] }) {
  const total = statuses.length;
  const done = statuses.filter((s) => s === "done").length;
  // Node center to node center: the row width minus one node, split into (total - 1) gaps
  const pitch = `(100% - 30px) / ${total - 1}`;

  return (
    <Card className="relative z-10">
      {/* Grows if the title wraps (320 wide), so it never runs into the nodes */}
      <div className="flex min-h-6.5 items-baseline justify-between gap-3">
        <h2 className="text-navy-900 type-title-2">Your transfer journey</h2>
        <p className="shrink-0 text-navy-900 tabular-nums type-caption">
          {done} of {total} complete
        </p>
      </div>
      <div role="img" aria-label={`${done} of ${total} steps complete`} className="relative mt-3 flex h-7.5 justify-between">
        {statuses.slice(0, -1).map((s, i) =>
          s === "done" && statuses[i + 1] === "done" ? (
            <span
              key={`bar-${i}`}
              data-connector
              className="absolute top-3 h-1.5 bg-green-600"
              style={{ left: `calc(15px + ${i} * ${pitch})`, width: `calc(${pitch})` }}
            />
          ) : null,
        )}
        {statuses.map((s, i) => (
          <span
            key={i}
            data-node={s === "done" ? "done" : "remaining"}
            className={`relative flex size-7.5 items-center justify-center rounded-full ${s === "done" ? "bg-green-600" : "bg-node-empty"}`}
          >
            {s === "done" && <CheckIcon weight="bold" size={16} className="text-white" />}
          </span>
        ))}
      </div>
    </Card>
  );
}
