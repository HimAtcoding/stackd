"use client";

import { TextLink } from "@/components/ui/text-link";
import { cn } from "@/lib/cn";
import { pathwayOn, sharedTopics, statusOf, stillNeeded, systemLabel, type ExploreMajor, type RequirementRecord, type Statuses, type SystemTab } from "@/lib/explore";
import { exploreHref } from "@/lib/features";

type StillNeededProps = {
  major: ExploreMajor;
  // UC, or Cal State when the plan has only Cal State schools
  tab: SystemTab;
  statuses: Statuses;
  onOpen: (row: RequirementRecord) => void;
};

// What's left for the student's own major (23 → Explore hero): the next two course types as cards side by side, taking
// now first, then not yet in the pathway's order. A card opens the requirement sheet (21 → 3); See all opens the major.
export function StillNeeded({ major, tab, statuses, onOpen }: StillNeededProps) {
  const pathway = pathwayOn(major, tab)!;
  const rows = stillNeeded(pathway, statuses, 2);
  const both = sharedTopics(major);

  return (
    <section aria-labelledby="still-needed-title" className="mt-8">
      <div className="flex items-baseline justify-between gap-4 px-6">
        <h2 id="still-needed-title" className="text-navy-900 type-title-2">
          Still needed
        </h2>
        <TextLink href={exploreHref(`major/?slug=${major.slug}&tab=${tab}`)!} transitionTypes={["push"]} size="label" className="shrink-0 tabular-nums">
          See all {pathway.requirements.length}
        </TextLink>
      </div>
      {rows.length === 0 ? (
        <p className="mt-2 px-6 text-slate-700 type-body">
          Every {systemLabel(tab)} course for {major.name} is marked done.
        </p>
      ) : (
        <ul className="mt-3 grid grid-cols-2 gap-2.5 px-4">
          {rows.map((r) => {
            const taking = statusOf(statuses, r.topic) === "in_progress";
            const counts = both.has(r.topic);
            return (
              <li key={r.id} className="flex">
                <button
                  type="button"
                  onClick={() => onOpen(r)}
                  aria-label={`${r.name}, ${taking ? "taking now" : "next"}${counts ? ", counts for UC and Cal State" : ""}`}
                  className={cn(
                    "flex w-full flex-col items-start rounded-lg border-2 bg-surface p-[14px] text-left edge-md",
                    taking ? "border-blue-600 edge-blue-600" : "border-border",
                  )}
                >
                  <span aria-hidden className={cn("type-caption", taking ? "text-blue-600" : "text-slate-600")}>
                    {taking ? "Taking now" : "Next"}
                  </span>
                  <span aria-hidden className="mt-1 line-clamp-2 text-navy-900 type-row-title">
                    {r.name}
                  </span>
                  {counts && (
                    <span aria-hidden className="mt-1 text-green-700 type-caption">
                      Counts for UC and Cal State
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
