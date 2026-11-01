"use client";

import Link from "next/link";
import { Art } from "@/components/art";
import { SegmentedBar } from "@/components/ui/segmented-bar";
import type { PlanTarget } from "@/lib/data/plan";
import { panelTab, pathwayOn, pathwayProgress, resolveTab, sharedTopics, type ExploreMajor, type Statuses } from "@/lib/explore";
import { exploreHref } from "@/lib/features";

type MajorPanelProps = {
  major: ExploreMajor;
  // The major's name in the plan
  name: string;
  targets: PlanTarget[];
  statuses: Statuses;
};

// The solid "Your major" panel (21 → Panel), the Explore tab's one bold thing. The whole panel opens the major.
// A major with no UC pathway counts its Cal State degree instead.
export function MajorPanel({ major, name, targets, statuses }: MajorPanelProps) {
  const tab = resolveTab(major, panelTab(targets));
  const counted = resolveTab(major, "uc");
  const pathway = pathwayOn(major, counted)!;
  const { done, total, list } = pathwayProgress(pathway, statuses);
  const shared = sharedTopics(major).size;

  return (
    <div className="mx-4 mt-4">
      <Link
        href={exploreHref(`major/?slug=${major.slug}&tab=${tab}`)!}
        transitionTypes={["push"]}
        className="relative block overflow-hidden rounded-lg bg-mint-800 p-5 text-white shadow-lift pressed:bg-mint-pressed"
      >
        <div className="relative z-10 min-[340px]:pr-[96px]">
          <p className="text-white/90 type-label">Your major</p>
          <p className="mt-1 type-title-1">{name}</p>
          <div className="mt-4 flex items-center gap-3">
            <SegmentedBar steps={list.map((s) => (s === "done" ? true : s === "in_progress" ? "taking" : false))} onFill className="min-w-0 flex-1" />
            <p className="shrink-0 tabular-nums type-label">
              {done} of {total} done for {counted === "uc" ? "UC" : "Cal State"}
            </p>
          </div>
          {counted === "uc" && shared > 0 && <p className="mt-2 text-white/90 type-body">{shared} also count for Cal State.</p>}
        </div>
        <span aria-hidden className="absolute -bottom-px right-0 hidden min-[340px]:block">
          <Art id="husky-looking" width={112} />
        </span>
      </Link>
    </div>
  );
}
