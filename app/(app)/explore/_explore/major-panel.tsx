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
        {/* Runs to the panel's right edge. The title stops 112 short of it, and a one-line title still fits the husky's 111 height. */}
        <div className="relative -mx-5 px-5 pb-4 min-[340px]:min-h-[107px]">
          <div className="min-[340px]:pr-[92px]">
            <p className="text-white/90 type-label">Your major</p>
            <p className="mt-1 wrap-break-word type-title-1">{name}</p>
          </div>
          <span aria-hidden className="absolute bottom-2 right-0 hidden min-[340px]:block">
            <Art id="husky-looking" width={112} />
          </span>
        </div>
        <SegmentedBar steps={list.map((s) => (s === "done" ? true : s === "in_progress" ? "taking" : false))} onFill />
        <p className="mt-2 tabular-nums type-label">
          {done} of {total} done for {counted === "uc" ? "UC" : "Cal State"}
        </p>
        {counted === "uc" && shared > 0 && <p className="mt-2 text-white/90 type-body">{shared} also count for Cal State.</p>}
      </Link>
    </div>
  );
}
