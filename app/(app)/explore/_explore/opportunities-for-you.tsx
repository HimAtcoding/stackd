"use client";

import { TextLink } from "@/components/ui/text-link";
import { useOpportunities } from "@/lib/data/opportunities";
import { exploreHref } from "@/lib/features";
import { forYou } from "@/lib/opportunities";
import { OpportunityCard } from "../_opportunities/opportunity-card";
import { useStudent, useToday } from "../_opportunities/use-student";

// The soonest open opportunity that fits the student, as the card with its date tile (23 → Opportunity card). Hidden
// when none is open, and while the rows are loading or couldn't load.
export function OpportunitiesForYou() {
  const state = useOpportunities();
  const student = useStudent();
  const today = useToday();
  if (state.status !== "ok" || !today) return null;
  const [o] = forYou(state.rows, student, today);
  if (!o) return null;

  return (
    <section aria-labelledby="for-you-title" className="mt-8">
      <div className="flex items-baseline justify-between gap-4 px-6">
        <h2 id="for-you-title" className="text-navy-900 type-title-2">
          Opportunities for you
        </h2>
        <TextLink href={exploreHref("opportunities/")!} transitionTypes={["push"]} size="label" className="shrink-0">
          See all
        </TextLink>
      </div>
      <div className="mt-3 px-4">
        <OpportunityCard opportunity={o} today={today} lead="date" />
      </div>
    </section>
  );
}
