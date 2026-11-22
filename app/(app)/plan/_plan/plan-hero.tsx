"use client";

import { Hero } from "@/components/ui/hero";
import { PrimaryButton } from "@/components/ui/primary-button";
import { TRANSFER_UNITS } from "@/lib/plan/view";

type PlanHeroProps = {
  unitsDone: number;
  coursesLeft: number;
  terms: number;
  built: boolean;
  onBuild: () => void;
};

// The plan's one hero (24 → 1): units toward the 60 a transfer needs, what's left, and Build my plan or Rebuild plan
export function PlanHero({ unitsDone, coursesLeft, terms, built, onBuild }: PlanHeroProps) {
  const pct = Math.min(100, (unitsDone / TRANSFER_UNITS) * 100);
  return (
    <Hero tone="blue">
      <p className="tabular-nums type-title-2">
        {unitsDone} of {TRANSFER_UNITS} units
      </p>
      <div
        role="progressbar"
        aria-label="Transferable units finished"
        aria-valuemin={0}
        aria-valuemax={TRANSFER_UNITS}
        aria-valuenow={Math.round(unitsDone)}
        className="mt-3 h-3 overflow-hidden rounded-full bg-blue-700"
      >
        <div className="h-full rounded-full bg-yellow-400 transition-[width] duration-320 ease-out motion-reduce:transition-none" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 tabular-nums type-label">
        {coursesLeft} {coursesLeft === 1 ? "course" : "courses"} left, {terms} {terms === 1 ? "term" : "terms"}
      </p>
      {built ? (
        // Secondary in weight: white, 48 tall, the hero's own edge color
        <button
          type="button"
          onClick={onBuild}
          className="mt-4 flex h-12 w-fit items-center rounded-md bg-white px-5 text-blue-600 type-button edge-md edge-blue-700 focus-ring:outline-offset-3"
        >
          Rebuild plan
        </button>
      ) : (
        <PrimaryButton onHero onClick={onBuild} className="mt-4">
          Build my plan
        </PrimaryButton>
      )}
    </Hero>
  );
}
