"use client";

import { StatusTile } from "@/components/ui/status-tile";
import { TextLink } from "@/components/ui/text-link";
import { pathwayOn, statusOf, stillNeeded, systemLabel, type ExploreMajor, type RequirementRecord, type Statuses, type SystemTab } from "@/lib/explore";
import { topicIcon } from "@/lib/explore-icons";
import { exploreHref } from "@/lib/features";

type StillNeededProps = {
  major: ExploreMajor;
  // UC, or Cal State when the plan has only Cal State schools
  tab: SystemTab;
  statuses: Statuses;
  onOpen: (row: RequirementRecord) => void;
};

// What's left for the student's own major (22 → 3): up to 4 course types, taking now first, then not yet in the
// pathway's order. A row opens the requirement sheet (21 → 3); See all opens the major page.
export function StillNeeded({ major, tab, statuses, onOpen }: StillNeededProps) {
  const pathway = pathwayOn(major, tab)!;
  const rows = stillNeeded(pathway, statuses);
  const system = systemLabel(tab);

  return (
    <section aria-labelledby="still-needed-title" className="mt-6">
      <div className="flex items-baseline justify-between gap-4 px-6">
        <h2 id="still-needed-title" className="text-navy-900 type-title-3">
          Still needed for {system}
        </h2>
        <TextLink href={exploreHref(`major/?slug=${major.slug}&tab=${tab}`)!} transitionTypes={["push"]} size="label" className="shrink-0 tabular-nums">
          See all {pathway.requirements.length}
        </TextLink>
      </div>
      {rows.length === 0 ? (
        <p className="mt-2 px-6 text-slate-700 type-body">
          Every {system} course for {major.name} is marked done.
        </p>
      ) : (
        <ul className="mt-2 flex flex-col px-2">
          {rows.map((r) => {
            const taking = statusOf(statuses, r.topic) === "in_progress";
            return (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => onOpen(r)}
                  aria-label={taking ? `${r.name}, taking now` : r.name}
                  className="flex min-h-14 w-full items-center gap-3 rounded-md px-4 py-2 text-left transition-colors duration-200 ease-out pressed:bg-surface-pressed pressed:duration-120"
                >
                  <StatusTile status={statusOf(statuses, r.topic)} name={r.name} icon={topicIcon(r.topic)} tone="green" size={32} />
                  <span aria-hidden className="line-clamp-2 min-w-0 flex-1 text-navy-900 type-row-title">
                    {r.name}
                  </span>
                  {taking && (
                    <span aria-hidden className="shrink-0 text-blue-700 type-caption">
                      Taking now
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
