"use client";

import { Art } from "@/components/art";
import { Hero } from "@/components/ui/hero";
import { SegmentedBar } from "@/components/ui/segmented-bar";
import type { PlanTarget } from "@/lib/data/plan";
import { panelTab, pathwayOn, pathwayProgress, resolveTab, systemLabel, type ExploreMajor, type Pathway, type Statuses, type SystemTab } from "@/lib/explore";
import { exploreHref } from "@/lib/features";

type MajorPanelProps = {
  major: ExploreMajor;
  // The major's name in the plan
  name: string;
  targets: PlanTarget[];
  statuses: Statuses;
};

// The "Your major" hero on the Explore tab (23 → Explore hero). The whole hero opens the major. A major with no UC
// pathway counts its Cal State degree instead.
export function MajorPanel({ major, name, targets, statuses }: MajorPanelProps) {
  const tab = resolveTab(major, panelTab(targets));
  const counted = resolveTab(major, "uc");
  return (
    <MajorHero
      label="Your major"
      name={name}
      pathway={pathwayOn(major, counted)!}
      tab={counted}
      statuses={statuses}
      href={exploreHref(`major/?slug=${major.slug}&tab=${tab}`)!}
      className="mx-4 mt-6"
    />
  );
}

type MajorHeroProps = {
  label: string;
  // Left out on the major page, where the band above already names the major
  name?: string;
  pathway: Pathway;
  tab: SystemTab;
  statuses: Statuses;
  // Opens the major; without one the hero is passive
  href?: string;
  className?: string;
};

// The green major hero (23), on Explore and the major page: the label, the major, its segmented bar and the count,
// with the husky in the corner
export function MajorHero({ label, name, pathway, tab, statuses, href, className }: MajorHeroProps) {
  const { done, total, taking, list } = pathwayProgress(pathway, statuses);
  const head = `${done} of ${total} done for ${systemLabel(tab)}`;
  const tail = taking > 0 ? `${taking} taking now` : null;
  const count = tail ? `${head}, ${tail}` : head;

  return (
    <div className={className}>
      <Hero
        tone="green"
        href={href}
        transitionTypes={href ? ["push"] : undefined}
        aria-label={href ? `${label}, ${name}. ${count}.` : undefined}
        className="relative min-h-[132px] overflow-hidden"
      >
        {/* The text stops short of the husky, which overlaps the bottom-right corner by 6 and is cut by it */}
        <div aria-hidden={href ? true : undefined} className="relative z-10 max-w-[200px] max-[359px]:max-w-[calc(100%-112px)]">
          <p className="type-label">{label}</p>
          {name && <p className="mt-1 wrap-break-word type-title-2">{name}</p>}
          <SegmentedBar steps={list.map((s) => (s === "done" ? true : s === "in_progress" ? "taking" : false))} onFill className="mt-3" />
          {/* Breaks after the system so no word is left alone on a line */}
          <p className="mt-2 tabular-nums type-label">
            <span className="block">{tail ? `${head},` : head}</span>
            {tail && <span className="block">{tail}</span>}
          </p>
        </div>
        <span aria-hidden className="absolute -bottom-1.5 -right-1.5 w-32">
          <Art id="husky-looking" width={128} className="w-full" />
        </span>
      </Hero>
    </div>
  );
}
