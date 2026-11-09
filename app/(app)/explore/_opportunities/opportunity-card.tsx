"use client";

import Link from "next/link";
import type { Icon } from "@phosphor-icons/react";
import { FlaskIcon, MedalIcon, StarIcon, TrophyIcon } from "@phosphor-icons/react/ssr";
import { DateTile } from "@/components/ui/date-row";
import { IconCircle, type Tone } from "@/components/ui/icon-circle";
import { Pill } from "@/components/ui/pill";
import { exploreHref } from "@/lib/features";
import { applyLine, datePill, goodPills, tileParts, tileStatus, type Opportunity, type OpportunityKind } from "@/lib/opportunities";

export const opportunityHref = (slug: string) => exploreHref(`opportunities/item/?slug=${encodeURIComponent(slug)}`)!;

// Each kind's icon circle (23 → Opportunity card): money in honey, research in blue, competitions in green, the rest
// in indigo
export function kindLook(kind: OpportunityKind): { tone: Tone; icon: Icon } {
  if (kind === "scholarship") return { tone: "yellow", icon: MedalIcon };
  if (kind === "research") return { tone: "blue", icon: FlaskIcon };
  if (kind === "competition") return { tone: "green", icon: TrophyIcon };
  return { tone: "indigo", icon: StarIcon };
}

type OpportunityCardProps = {
  opportunity: Opportunity;
  today: string;
  // Matched against the student's plan: shows the "Fits you" pill
  fitsYou: boolean;
  // The hub leads with the date tile; the feed with the kind's icon circle
  lead?: "icon" | "date";
};

// One opportunity as a tappable card (23 → Opportunity card): the icon circle or date tile, the name and who runs it,
// then the date pill and up to two good pills. The whole card is the button.
export function OpportunityCard({ opportunity: o, today, fitsYou, lead = "icon" }: OpportunityCardProps) {
  const date = datePill(o, today);
  const good = goodPills(o, fitsYou);
  const { tone, icon: Glyph } = kindLook(o.kind);
  const tile = o.deadline ? tileParts(o.deadline) : null;
  return (
    <Link
      href={opportunityHref(o.slug)}
      transitionTypes={["push"]}
      aria-label={`${o.title}, ${o.org_name}. ${applyLine(o)}. ${date.text}.${good.length ? ` ${good.join(", ")}.` : ""}`}
      className="block rounded-lg border-2 border-border bg-surface p-[14px] edge-md"
    >
      <span aria-hidden className="flex items-center gap-3">
        {lead === "date" ? (
          <DateTile month={tile?.month} day={tile?.day} status={tileStatus(o, today)} />
        ) : (
          <IconCircle tone={tone}>
            <Glyph weight="fill" size={22} />
          </IconCircle>
        )}
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 text-navy-900 type-headline">{o.title}</span>
          <span className="mt-0.5 block text-slate-600 type-label">{o.org_name}</span>
        </span>
      </span>
      <span aria-hidden className="mt-2.5 flex flex-wrap gap-1.5">
        <Pill variant={date.variant}>{date.text}</Pill>
        {good.map((g) => (
          <Pill key={g} variant="good">
            {g}
          </Pill>
        ))}
      </span>
    </Link>
  );
}
