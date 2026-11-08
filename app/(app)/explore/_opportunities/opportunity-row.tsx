"use client";

import Link from "next/link";
import { DateTile } from "@/components/ui/date-row";
import { exploreHref } from "@/lib/features";
import { applyLine, forLine, tileParts, tileStatus, type Opportunity } from "@/lib/opportunities";

type OpportunityRowProps = {
  opportunity: Opportunity;
  today: string;
  nameOf: (slug: string) => string;
};

export const opportunityHref = (slug: string) => exploreHref(`opportunities/item/?slug=${encodeURIComponent(slug)}`)!;

// One opportunity in a list (22 → 3, 4): 18's date tile for the deadline (the rolling tile with none), the title, who
// runs it, and who it's for. The whole row is the button.
export function OpportunityRow({ opportunity: o, today, nameOf }: OpportunityRowProps) {
  const status = tileStatus(o, today);
  const date = o.deadline ? tileParts(o.deadline) : null;
  const who = forLine(o, nameOf);
  return (
    <Link
      href={opportunityHref(o.slug)}
      transitionTypes={["push"]}
      aria-label={`${o.title}, ${o.org_name}. ${applyLine(o)}. ${who}`}
      className="flex min-h-18 items-start gap-3 rounded-md px-4 py-3 transition-colors duration-200 ease-out pressed:bg-surface-pressed pressed:duration-120"
    >
      <DateTile month={date?.month} day={date?.day} status={status} />
      <span aria-hidden className="min-w-0 flex-1">
        <span className="line-clamp-2 text-navy-900 type-row-title">{o.title}</span>
        <span className="mt-0.5 block text-slate-600 type-caption">{o.org_name}</span>
        <span className="mt-0.5 block text-navy-900 type-caption">{who}</span>
      </span>
    </Link>
  );
}
