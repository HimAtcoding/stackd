"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BackButton } from "@/components/back-button";
import { InlineError } from "@/components/ui/inline-error";
import { LinkLine } from "@/components/ui/link-line";
import { Loading } from "@/components/ui/loading";
import { RequirementRow } from "@/components/ui/requirement-row";
import { SectionBand } from "@/components/ui/section-band";
import { SegmentedBar } from "@/components/ui/segmented-bar";
import { SourceBlock } from "@/components/ui/source-block";
import { TintedButton } from "@/components/ui/tinted-button";
import { Toast } from "@/components/ui/toast";
import { UnderlineTabs } from "@/components/ui/underline-tabs";
import { GoHome } from "@/components/unbuilt-route";
import { retryExplore, useAgreement, useMajors } from "@/lib/data/explore";
import { usePlan } from "@/lib/data/plan";
import { setTopicStatus, useTopicStatus } from "@/lib/data/topic-status";
import {
  agreementLine,
  campusRows,
  DEGREE_NOTE,
  pathwayOn,
  pathwayProgress,
  problemMailto,
  progressLine,
  resolveTab,
  sharedTopics,
  sourceLine,
  sourceLinkLabel,
  statusOf,
  tabsOf,
  unitsLine,
  type ExploreMajor,
  type RequirementRecord,
  type SystemTab,
} from "@/lib/explore";
import { topicIcon } from "@/lib/explore-icons";
import { exploreHref } from "@/lib/features";
import { CampusList } from "./campus-list";
import { RequirementSheet } from "./requirement-sheet";

const TOAST_BOTTOM = "calc(var(--safe-bottom) + 12px)";
// Where adegreewithaguarantee.com, the site Cal State points students to, now redirects (21 → Find at your college)
const CAL_STATE_MATCHES = "https://icangotocollege.com";

// With Explore's flag off the address goes Home; a major that isn't listed goes back to the list (13: no dead ends)
export function MajorRoute() {
  if (!exploreHref()) return <GoHome />;
  return <MajorLoad />;
}

function MajorLoad() {
  const router = useRouter();
  const params = useSearchParams();
  const state = useMajors();
  const major = state.status === "ok" ? state.majors.find((m) => m.slug === params.get("slug")) : undefined;
  const missing = state.status === "ok" && !major;

  useEffect(() => {
    if (missing) router.replace(exploreHref()!);
  }, [missing, router]);

  if (major) return <MajorScreen key={major.slug} major={major} wantedTab={params.get("tab")} />;
  if (missing) return null;
  return (
    <div className="min-h-dvh overflow-x-clip bg-sky-50">
      <main className="mx-auto max-w-[480px]">
        <SectionBand title="Explore" subtitle="What to take before you transfer." back={<BackButton fallback={exploreHref()!} slideBack />} />
        {state.status === "error" ? (
          <div className="mx-4 mt-4">
            <InlineError title="Couldn't load this major" body="Check your connection, then try again." action={<TintedButton onClick={retryExplore}>Try again</TintedButton>} />
          </div>
        ) : (
          <div className="mt-12">
            <Loading label="Loading this major" />
          </div>
        )}
      </main>
    </div>
  );
}

function MajorScreen({ major, wantedTab }: { major: ExploreMajor; wantedTab: string | null }) {
  const tab = resolveTab(major, wantedTab);
  const pathway = pathwayOn(major, tab)!;
  const tabs = tabsOf(major);
  const statuses = useTopicStatus();
  const planState = usePlan();
  const plan = planState.status === "ok" ? planState.plan : null;
  const agreement = useAgreement(plan, major.slug);
  const [toast, setToast] = useState<{ key: number; topic: string; before: ReturnType<typeof statusOf> } | null>(null);
  const [sheet, setSheet] = useState<{ row: RequirementRecord; open: boolean } | null>(null);

  const shared = sharedTopics(major);
  const progress = pathwayProgress(pathway, statuses);
  const find = agreementLine("these", agreement);
  const units = unitsLine(pathway);

  // Switching tabs replaces ?tab= (keeping ?slug=) without adding a history entry
  function changeTab(id: string) {
    const params = new URLSearchParams(window.location.search);
    params.set("tab", id as SystemTab);
    window.history.replaceState(null, "", `?${params}`);
  }

  // A tap toggles Done from either other state. Undo puts back what it was.
  function toggle(topic: string) {
    const before = statusOf(statuses, topic);
    if (before === "done") return setTopicStatus(topic, "not_started");
    setTopicStatus(topic, "done");
    setToast((t) => ({ key: (t?.key ?? 0) + 1, topic, before }));
  }

  // The same course type in the other system, for "Counts for both"
  const other = sheet && shared.has(sheet.row.topic) ? pathwayOn(major, tab === "uc" ? "cal-state" : "uc")?.requirements.find((r) => r.topic === sheet.row.topic) : undefined;

  return (
    <div className="min-h-dvh overflow-x-clip bg-sky-50">
      <main className="mx-auto max-w-[480px]" style={{ paddingBottom: "calc(var(--safe-bottom) + 24px)" }}>
        <SectionBand
          title={major.name}
          subtitle={tabs.length > 1 ? "What to take before you transfer." : tab === "uc" ? "UC Transfer Pathway" : "Cal State degree for transfer"}
          back={<BackButton fallback={exploreHref()!} slideBack />}
        >
          {tabs.length > 1 ? <UnderlineTabs tabs={tabs} value={tab} onChange={changeTab} aria-label={`${major.name} by system`} fit onTint className="mt-4 px-2.5" /> : <div className="h-4" />}
        </SectionBand>

        <div role={tabs.length > 1 ? "tabpanel" : undefined} aria-label={tabs.find((t) => t.id === tab)?.label}>
          <section aria-label="Your progress" className="mt-4 px-6">
            <p className="text-navy-900 tabular-nums type-label">{progressLine(progress)}</p>
            <SegmentedBar steps={progress.list.map((s) => s === "done")} className="mt-2" />
          </section>

          <ul className="mt-3">
            {pathway.requirements.map((r) => (
              <li key={r.id}>
                <RequirementRow
                  name={r.name}
                  howMany={r.how_many}
                  countsForBoth={shared.has(r.topic)}
                  status={statusOf(statuses, r.topic)}
                  icon={topicIcon(r.topic)}
                  onToggle={() => toggle(r.topic)}
                  onOpen={() => setSheet({ row: r, open: true })}
                />
              </li>
            ))}
          </ul>

          {tab === "uc" ? (
            <>
              <div className="mt-3 px-6">
                <LinkLine href={find.href} label={find.label} detail={find.detail} />
              </div>
              <h2 className="mt-8 px-6 text-navy-900 type-title-3">Campuses that use this pathway ({pathway.campuses.length})</h2>
              <CampusList rows={campusRows(pathway, plan?.targets.map((t) => t.institutionId) ?? [])} />
            </>
          ) : (
            <div className="mt-3 px-6">
              <p className="text-slate-700 type-body">Your college&apos;s catalog shows the C-ID number next to each matching course.</p>
              <LinkLine href={CAL_STATE_MATCHES} label="See which Cal State majors match" className="mt-2" />
              <h2 className="mt-8 text-navy-900 type-title-3">What this degree does</h2>
              <p className="mt-2 text-navy-900 type-body">{DEGREE_NOTE}</p>
              {units && <p className="mt-2 text-slate-600 tabular-nums type-caption">{units}</p>}
            </div>
          )}

          <SourceBlock
            line={sourceLine(pathway)}
            link={{ href: pathway.source_url, label: sourceLinkLabel(pathway) }}
            report={problemMailto(major, tab, pathway)}
            className="mt-8 px-6"
          />
        </div>
      </main>

      <RequirementSheet
        open={Boolean(sheet?.open)}
        onClose={() => setSheet((s) => s && { ...s, open: false })}
        row={sheet?.row ?? null}
        other={other}
        tab={tab}
        status={sheet ? statusOf(statuses, sheet.row.topic) : "not_started"}
        agreement={agreement}
      />

      {toast && (
        <Toast
          key={toast.key}
          message="Marked done"
          bottom={TOAST_BOTTOM}
          overSheet={Boolean(sheet?.open)}
          action={{
            label: "Undo",
            onClick: () => {
              setTopicStatus(toast.topic, toast.before);
              setToast(null);
            },
          }}
          onDone={() => setToast(null)}
        />
      )}
    </div>
  );
}
