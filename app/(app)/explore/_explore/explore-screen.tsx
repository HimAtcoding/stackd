"use client";

import Link from "next/link";
import { useState } from "react";
import { GraduationCapIcon } from "@phosphor-icons/react/ssr";
import { Art } from "@/components/art";
import { AskCard } from "@/components/ui/ask-card";
import { InlineError } from "@/components/ui/inline-error";
import { LinkLine } from "@/components/ui/link-line";
import { Loading } from "@/components/ui/loading";
import { MajorRow } from "@/components/ui/major-row";
import { SearchField } from "@/components/ui/search-field";
import { SectionBand } from "@/components/ui/section-band";
import { SegmentedBar } from "@/components/ui/segmented-bar";
import { TAB_PAGE_BOTTOM, TabBar } from "@/components/ui/tab-bar";
import { TextLink } from "@/components/ui/text-link";
import { TintedButton } from "@/components/ui/tinted-button";
import { GoHome } from "@/components/unbuilt-route";
import { ASSIST_HOME } from "@/lib/about";
import { retryExplore, useAgreement, useMajors } from "@/lib/data/explore";
import { retryPlan, usePlan } from "@/lib/data/plan";
import { useTopicStatus } from "@/lib/data/topic-status";
import {
  majorDetail,
  panelTab,
  pathwayOn,
  pathwayProgress,
  planMajor,
  resolveTab,
  searchMajors,
  sharedTopics,
  statusOf,
  systemLabel,
  tabsOf,
  type ExploreMajor,
  type RequirementRecord,
  type Statuses,
  type SystemTab,
} from "@/lib/explore";
import { majorIcon } from "@/lib/explore-icons";
import { aboutDataHref, exploreHref } from "@/lib/features";
import { MajorPanel } from "./major-panel";
import { OpportunitiesForYou } from "./opportunities-for-you";
import { RequirementSheet } from "./requirement-sheet";
import { StillNeeded } from "./still-needed";

// The Explore tab exists only with its flag on; otherwise the address goes Home (13: no dead ends)
export function ExploreRoute() {
  if (!exploreHref()) return <GoHome />;
  return <ExploreScreen />;
}

function NoResults({ query, count }: { query: string; count: number }) {
  return (
    <div role="status" className="mx-auto mt-8 flex max-w-[320px] flex-col items-center px-6 text-center">
      <Art id="husky-looking-full" width={140} />
      <h2 className="mt-4 text-navy-900 [overflow-wrap:anywhere] type-title-3">No majors match &ldquo;{query.trim()}&rdquo; yet.</h2>
      <p className="mt-2 text-slate-700 type-body">
        Explore has {count} {count === 1 ? "major" : "majors"} so far. Your counselor or ASSIST can help with others.
      </p>
      <LinkLine href={ASSIST_HOME} label="Open ASSIST" className="mt-3 text-left" />
    </div>
  );
}

// The student's own major shows its progress with a mini bar; the others say where they lead (22 → 3)
function MajorList({ majors, mine }: { majors: ExploreMajor[]; mine: { slug: string; tab: SystemTab; statuses: Statuses } | null }) {
  return (
    <ul className="mt-3 flex flex-col gap-1 px-2">
      {majors.map((m) => {
        const own = mine?.slug === m.slug ? pathwayProgress(pathwayOn(m, mine.tab)!, mine.statuses) : null;
        const detail = own ? (
          <span className="flex items-center gap-2">
            <SegmentedBar steps={own.list.map((s) => s === "done")} thin className="w-[60px] shrink-0" />
            <span className="tabular-nums">
              {own.done} of {own.total} for {systemLabel(mine!.tab)}
            </span>
          </span>
        ) : (
          majorDetail(m)
        );
        return (
          <li key={m.slug}>
            <MajorRow href={exploreHref(`major/?slug=${m.slug}&tab=${own ? mine!.tab : tabsOf(m)[0].id}`)!} name={m.name} detail={detail} icon={majorIcon(m.slug)} />
          </li>
        );
      })}
    </ul>
  );
}

function ExploreScreen() {
  const [query, setQuery] = useState("");
  const state = useMajors();
  const planState = usePlan();
  const statuses = useTopicStatus();
  const howWeCheck = aboutDataHref();
  const [sheet, setSheet] = useState<{ row: RequirementRecord; open: boolean } | null>(null);

  const majors = state.status === "ok" ? state.majors : [];
  const shown = searchMajors(majors, query);
  const plan = planState.status === "ok" ? planState.plan : null;
  const mine = plan ? planMajor(plan.targets, majors) : null;
  const searching = query.trim().length > 0;
  // A plan with a major that Explore has no data for gets neither the panel nor the ask (21 → Panel)
  const noMajor = plan !== null && !plan.targets.some((t) => t.majorId);
  // Still needed and the mini bar count UC, or Cal State when the plan has only Cal State schools
  const tab = mine && plan ? resolveTab(mine.major, panelTab(plan.targets)) : "uc";
  const agreement = useAgreement(plan, mine?.major.slug ?? "");
  const other =
    mine && sheet && sharedTopics(mine.major).has(sheet.row.topic)
      ? pathwayOn(mine.major, tab === "uc" ? "cal-state" : "uc")?.requirements.find((r) => r.topic === sheet.row.topic)
      : undefined;

  return (
    <div className="min-h-dvh overflow-x-clip bg-sky-50">
      <main className="mx-auto max-w-[480px]" style={{ paddingBottom: TAB_PAGE_BOTTOM }}>
        <SectionBand title="Explore" subtitle="What to take for your major, at UC and Cal State.">
          <div className="px-4 pb-4 pt-4">
            <SearchField id="explore-search" placeholder="Search majors" value={query} onChange={setQuery} />
          </div>
        </SectionBand>

        {state.status === "error" ? (
          <div className="mx-4 mt-4">
            <InlineError title="Couldn't load majors" body="Check your connection, then try again." action={<TintedButton onClick={retryExplore}>Try again</TintedButton>} />
          </div>
        ) : state.status === "loading" ? (
          <div className="mt-12">
            <Loading label="Loading majors" />
          </div>
        ) : (
          <>
            {!searching && mine && plan && (
              <MajorPanel major={mine.major} name={mine.name} targets={plan.targets} statuses={statuses} />
            )}
            {!searching && mine && <StillNeeded major={mine.major} tab={tab} statuses={statuses} onOpen={(row) => setSheet({ row, open: true })} />}
            {!searching && <OpportunitiesForYou />}
            {!searching && noMajor && (
              <AskCard labelledBy="pick-major-title" icon={<GraduationCapIcon weight="fill" size={24} aria-hidden />} className="mx-4 mt-4">
                <h2 id="pick-major-title" className="text-navy-900 type-headline">
                  Pick your major to see what to take.
                </h2>
                <TextLink href="/settings/" size="label" onTint className="mt-1">
                  Choose your major
                </TextLink>
              </AskCard>
            )}
            {!searching && planState.status === "error" && (
              <div className="mx-4 mt-4">
                <InlineError title="Couldn't load your plan" body="Check your connection, then try again." action={<TintedButton onClick={retryPlan}>Try again</TintedButton>} />
              </div>
            )}

            {shown.length > 0 ? (
              <section aria-labelledby="all-majors-title">
                <h2 id="all-majors-title" className="mt-6 px-6 text-navy-900 type-title-3">
                  Majors ({shown.length})
                </h2>
                <MajorList majors={shown} mine={mine ? { slug: mine.major.slug, tab, statuses } : null} />
                {/* One source line at the very bottom (22 → 3), replacing 21's two-part footer */}
                <footer className="mt-8 px-6">
                  <p className="text-slate-600 type-caption">
                    From UC Admissions and the CCC Chancellor&apos;s Office.
                    {howWeCheck && (
                      <>
                        {" "}
                        <Link
                          href={howWeCheck}
                          className="-my-[14px] inline-block py-[14px] font-semibold text-blue-700 no-underline pressed:underline focus-ring:underline"
                        >
                          How we check this
                        </Link>
                      </>
                    )}
                  </p>
                </footer>
              </section>
            ) : (
              <NoResults query={query} count={majors.length} />
            )}
          </>
        )}
      </main>
      <TabBar active="explore" />
      {mine && (
        <RequirementSheet
          open={Boolean(sheet?.open)}
          onClose={() => setSheet((s) => s && { ...s, open: false })}
          row={sheet?.row ?? null}
          other={other}
          tab={tab}
          status={sheet ? statusOf(statuses, sheet.row.topic) : "not_started"}
          agreement={agreement}
        />
      )}
    </div>
  );
}
