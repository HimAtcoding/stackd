"use client";

import { Art } from "@/components/art";
import { Hero } from "@/components/ui/hero";
import { SegmentedBar } from "@/components/ui/segmented-bar";
import type { PlanTarget } from "@/lib/data/plan";
import { panelTab, pathwayOn, pathwayProgress, resolveTab, systemLabel, type ExploreMajor, type Statuses } from "@/lib/explore";
import { exploreHref } from "@/lib/features";

type MajorPanelProps = {
  major: ExploreMajor;
  // The major's name in the plan
  name: string;
  targets: PlanTarget[];
  statuses: Statuses;
};

// The "Your major" hero (23 → Explore hero), the Explore tab's one bold thing: the major, its segmented bar and the
// count, with the husky in the corner. The whole hero opens the major. A major with no UC pathway counts its Cal State
// degree instead.
export function MajorPanel({ major, name, targets, statuses }: MajorPanelProps) {
  const tab = resolveTab(major, panelTab(targets));
  const counted = resolveTab(major, "uc");
  const pathway = pathwayOn(major, counted)!;
  const { done, total, taking, list } = pathwayProgress(pathway, statuses);
  const system = systemLabel(counted);
  const count = taking > 0 ? `${done} of ${total} done for ${system}, ${taking} taking now` : `${done} of ${total} done for ${system}`;

  return (
    <div className="mx-4 mt-6">
      <Hero
        tone="green"
        href={exploreHref(`major/?slug=${major.slug}&tab=${tab}`)!}
        transitionTypes={["push"]}
        aria-label={`Your major, ${name}. ${count}.`}
        className="relative min-h-[132px] overflow-hidden"
      >
        {/* The text stops short of the husky, which overlaps the bottom-right corner by 6 and is cut by it */}
        <div aria-hidden className="relative z-10 max-w-[200px] max-[359px]:max-w-[calc(100%-112px)]">
          <p className="type-label">Your major</p>
          <p className="mt-1 wrap-break-word type-title-2">{name}</p>
          <SegmentedBar steps={list.map((s) => (s === "done" ? true : s === "in_progress" ? "taking" : false))} onFill className="mt-3" />
          <p className="mt-2 tabular-nums type-label">{count}</p>
        </div>
        <span aria-hidden className="absolute -bottom-1.5 -right-1.5 w-32">
          <Art id="husky-looking" width={128} className="w-full" />
        </span>
      </Hero>
    </div>
  );
}
