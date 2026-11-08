"use client";

import { TextLink } from "@/components/ui/text-link";
import { useOpportunities } from "@/lib/data/opportunities";
import { exploreHref } from "@/lib/features";
import { forYou } from "@/lib/opportunities";
import { OpportunityRow } from "../_opportunities/opportunity-row";
import { useMajorNamer, useStudent, useToday } from "../_opportunities/use-student";

// Up to 3 open opportunities that fit the student, soonest deadline first (22 → 3). Hidden when none is open, and
// while the rows are loading or couldn't load.
export function OpportunitiesForYou() {
  const state = useOpportunities();
  const student = useStudent();
  const nameOf = useMajorNamer();
  const today = useToday();
  if (state.status !== "ok" || !today) return null;
  const rows = forYou(state.rows, student, today);
  if (rows.length === 0) return null;

  return (
    <section aria-labelledby="for-you-title" className="mt-6">
      <div className="flex items-baseline justify-between gap-4 px-6">
        <h2 id="for-you-title" className="text-navy-900 type-title-3">
          Opportunities for you
        </h2>
        <TextLink href={exploreHref("opportunities/")!} transitionTypes={["push"]} size="label" className="shrink-0">
          See all
        </TextLink>
      </div>
      <ul className="mt-2 flex flex-col gap-1 px-2">
        {rows.map((o) => (
          <li key={o.id}>
            <OpportunityRow opportunity={o} today={today} nameOf={nameOf} />
          </li>
        ))}
      </ul>
    </section>
  );
}
