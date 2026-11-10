"use client";

import { useState } from "react";
import { Art } from "@/components/art";
import { BackButton } from "@/components/back-button";
import { ChoiceChip, ChoiceChips } from "@/components/ui/choice-chip";
import { InlineError } from "@/components/ui/inline-error";
import { Loading } from "@/components/ui/loading";
import { SectionBand } from "@/components/ui/section-band";
import { Switch } from "@/components/ui/switch";
import { SecondaryButton } from "@/components/ui/secondary-button";
import { GoHome } from "@/components/unbuilt-route";
import { retryOpportunities, useOpportunities } from "@/lib/data/opportunities";
import { exploreHref } from "@/lib/features";
import { feedGroups, fits, KIND_LABELS, type OpportunityKind } from "@/lib/opportunities";
import { OpportunityCard } from "./opportunity-card";
import { useStudent, useToday } from "./use-student";

// The chips in 22's order; internships show under All
const CHIPS: OpportunityKind[] = ["research", "scholarship", "competition", "program", "event"];

// With Explore's flag off the address goes Home (13: no dead ends)
export function FeedRoute() {
  if (!exploreHref()) return <GoHome />;
  return <FeedScreen />;
}

function FeedScreen() {
  const state = useOpportunities();
  const student = useStudent();
  const today = useToday();
  const [kind, setKind] = useState<OpportunityKind | null>(null);
  const [fitsOnly, setFitsOnly] = useState(true);

  const groups = state.status === "ok" && today ? feedGroups(state.rows, { kind, fitsOnly, student, today }) : [];

  return (
    <div className="min-h-dvh overflow-x-clip bg-page">
      <main className="mx-auto max-w-[480px]" style={{ paddingBottom: "calc(var(--safe-bottom) + 24px)" }}>
        <SectionBand
          title="Opportunities"
          subtitle="Research programs, scholarships and competitions for transfer students."
          back={<BackButton fallback={exploreHref()!} slideBack />}
        >
          <div className="h-4" />
        </SectionBand>

        <ChoiceChips aria-label="Kind" scroll className="mt-4 px-4">
          <ChoiceChip checked={kind === null} onSelect={() => setKind(null)}>
            All
          </ChoiceChip>
          {CHIPS.map((k) => (
            <ChoiceChip key={k} checked={kind === k} onSelect={() => setKind(k)}>
              {KIND_LABELS[k]}
            </ChoiceChip>
          ))}
        </ChoiceChips>
        <div className="mt-3 flex min-h-11 items-center justify-between gap-4 px-6">
          <span id="fits-label" className="text-navy-900 type-row-title">
            Only ones that fit me
          </span>
          <Switch checked={fitsOnly} onChange={setFitsOnly} aria-labelledby="fits-label" />
        </div>

        {state.status === "error" ? (
          <div className="mx-4 mt-6">
            <InlineError title="Couldn't load opportunities" body="Check your connection, then try again." action={<SecondaryButton onClick={retryOpportunities}>Try again</SecondaryButton>} />
          </div>
        ) : state.status === "loading" || !today ? (
          <div className="mt-12">
            <Loading label="Loading opportunities" />
          </div>
        ) : groups.length === 0 ? (
          <div role="status" className="mx-auto mt-8 flex max-w-[320px] flex-col items-center px-6 text-center">
            <Art id="husky-looking-full" width={140} />
            <h2 className="mt-4 text-navy-900 type-title-3">{fitsOnly ? "Nothing open for you right now." : "Nothing open right now."}</h2>
            {fitsOnly && (
              <button type="button" onClick={() => setFitsOnly(false)} className="mt-1 py-3 text-blue-600 type-link pressed:underline focus-ring:underline">
                Show all opportunities
              </button>
            )}
          </div>
        ) : (
          <>
            {groups.map((g) => (
              <section key={g.id} aria-labelledby={`group-${g.id}`}>
                <h2 id={`group-${g.id}`} className="mt-6 px-6 text-navy-900 type-title-3">
                  {g.title}
                </h2>
                <ul className="mt-3 flex flex-col gap-3 px-4">
                  {g.rows.map((o) => (
                    <li key={o.id}>
                      <OpportunityCard opportunity={o} today={today} fitsYou={!fitsOnly && fits(o, student)} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            <p className="mt-6 px-6 text-slate-600 type-caption">Stackd lists each opportunity in its own words and links to the official page.</p>
          </>
        )}
      </main>
    </div>
  );
}
