"use client";

import { useMemo, useState } from "react";
import { CaretDownIcon, MapTrifoldIcon } from "@phosphor-icons/react/ssr";
import { ConfirmSheet } from "@/app/(app)/essays/_essays/confirm-sheet";
import { TermQuestion } from "@/app/(app)/deadlines/_deadlines/term-question";
import { AskCard } from "@/components/ui/ask-card";
import { Expand } from "@/components/ui/expand";
import { InlineError } from "@/components/ui/inline-error";
import { Loading } from "@/components/ui/loading";
import { SecondaryButton } from "@/components/ui/secondary-button";
import { StatusIcon } from "@/components/ui/status-icon";
import { TAB_PAGE_BOTTOM, TAB_TOAST_BOTTOM, TabBar } from "@/components/ui/tab-bar";
import { TextLink } from "@/components/ui/text-link";
import { Toast } from "@/components/ui/toast";
import { GoHome } from "@/components/unbuilt-route";
import { cn } from "@/lib/cn";
import { addCustomCourse, saveItems, saveSettings, setItemStatus, suggestCourse, updateItem, useCoursePlan } from "@/lib/data/course-plan";
import { saveTerm, useTerm } from "@/lib/data/deadlines";
import { retryExplore, useMajors } from "@/lib/data/explore";
import { retryPlan, usePlan, type Plan } from "@/lib/data/plan";
import { useCollegeCourses, usePlanData, type CollegeCourse, type PlanData } from "@/lib/data/plan-data";
import { setTopicStatus, useTopicStatus } from "@/lib/data/topic-status";
import type { ExploreMajor, TopicStatus } from "@/lib/explore";
import { planHref } from "@/lib/features";
import { currentTerm, planTerms, type TermId } from "@/lib/plan/build";
import {
  applyBuild,
  finishChoices,
  markFinished,
  moveItem,
  planNeeds,
  planSystems,
  planView,
  termInSentence,
  transferTermOf,
  withDefaultUnits,
  type Card,
  type DefaultCourse,
  type StoredItem,
} from "@/lib/plan/view";
import { termLabel } from "@/lib/plan/warnings";
import { noteBuilt, noteDoneMark } from "@/lib/rating";
import { unitsShort } from "./course-card";
import { CourseSheet } from "./course-sheet";
import { CustomCourseSheet } from "./custom-course-sheet";
import { PlanBoard } from "./plan-board";
import { PlanHero } from "./plan-hero";
import { FinishedSheet } from "./finished-sheet";
import { SettingsSheet } from "./settings-sheet";

// The Plan tab exists only with its flag on; otherwise the address goes Home (13: no dead ends)
export function PlanRoute() {
  if (!planHref()) return <GoHome />;
  return <PlanScreen />;
}

// A need the plan doesn't hold yet gets an id once, so it stays the same card while it's dragged
const madeUpIds = new Map<string, string>();
const madeUpId = (key: string) => {
  if (!madeUpIds.has(key)) madeUpIds.set(key, crypto.randomUUID());
  return madeUpIds.get(key)!;
};

type Sheet = { kind: "course"; key: string } | { kind: "settings" } | { kind: "custom"; term: TermId } | { kind: "rebuild" } | { kind: "finished" };
type ToastState = { message: string; undo?: () => void; id: number };

// A bottom sheet slides out over 200 ms (00 → Bottom sheet)
const SHEET_EXIT_MS = 220;

function Header({ plan, transfer }: { plan: Plan | null; transfer: { term: TermId; guessed: boolean } | null }) {
  const first = plan?.targets[0];
  const route = plan?.home && first ? `${plan.home.name} to ${first.name}` : null;
  return (
    <header className="px-6" style={{ paddingTop: "calc(var(--safe-top) + var(--strip-h) + 24px)" }}>
      <h1 className="text-navy-900 type-title-1">Your plan</h1>
      {route && (
        <p className="mt-2 text-balance text-slate-600 type-body">
          {route}
          {transfer && `, ${termInSentence(transfer.term)}${transfer.guessed ? " (you're not sure yet)" : ""}`}
        </p>
      )}
    </header>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="mx-4 mt-6">{children}</div>;
}

function PlanScreen() {
  const planState = usePlan();
  const majorsState = useMajors();
  const [dataState, retryData] = usePlanData();
  const termChoice = useTerm();
  const plan = planState.status === "ok" ? planState.plan : null;
  const [today] = useState(() => new Date());
  const transfer = transferTermOf(termChoice, today);

  let body: React.ReactNode;
  if (planState.status === "error") {
    body = <InlineError title="Couldn't load your plan" body="Check your connection, then try again." action={<SecondaryButton onClick={retryPlan}>Try again</SecondaryButton>} />;
  } else if (majorsState.status === "error" || dataState.status === "error") {
    body = (
      <InlineError
        title="Couldn't load your courses"
        body="Check your connection, then try again."
        action={
          <SecondaryButton
            onClick={() => {
              retryExplore();
              retryData();
            }}
          >
            Try again
          </SecondaryButton>
        }
      />
    );
  } else if (!plan || majorsState.status !== "ok" || dataState.status !== "ok") {
    body = (
      <div className="mt-6">
        <Loading label="Loading your plan" />
      </div>
    );
  } else if (!plan.home || plan.targets.length === 0) {
    body = (
      <AskCard labelledBy="plan-setup-title" icon={<MapTrifoldIcon weight="fill" size={20} aria-hidden />}>
        <h2 id="plan-setup-title" className="text-navy-900 type-headline">
          Pick your college and schools to plan your terms.
        </h2>
        <TextLink href="/settings/" size="label" className="mt-1">
          Set up your plan
        </TextLink>
      </AskCard>
    );
  } else if (!transfer) {
    body = <TermQuestion onChoose={saveTerm} body="Your plan runs up to the term before it." />;
  } else {
    return (
      <Shell plan={plan} transfer={transfer}>
        <Planner plan={plan} majors={majorsState.majors} data={dataState.data} transfer={transfer} today={today} />
      </Shell>
    );
  }
  return (
    <Shell plan={plan} transfer={transfer}>
      <Centered>{body}</Centered>
    </Shell>
  );
}

function Shell({ plan, transfer, children }: { plan: Plan | null; transfer: { term: TermId; guessed: boolean } | null; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh overflow-x-clip bg-page">
      <main className="mx-auto max-w-[480px]" style={{ paddingBottom: TAB_PAGE_BOTTOM }}>
        <Header plan={plan} transfer={transfer} />
        {children}
      </main>
      <TabBar active="plan" />
    </div>
  );
}

type PlannerProps = {
  plan: Plan;
  majors: ExploreMajor[];
  data: PlanData;
  transfer: { term: TermId; guessed: boolean };
  today: Date;
};

function Planner({ plan, majors, data, transfer, today }: PlannerProps) {
  const statuses = useTopicStatus();
  const { items, settings } = useCoursePlan();
  const courses = useCollegeCourses(plan.home?.id ?? null);
  const [sheet, setSheetState] = useState<Sheet | null>(null);
  // False from a sheet opening until it has slid away (200 ms), so a toast doesn't land on it
  const [settled, setSettled] = useState(true);
  const setSheet = (next: Sheet | null) => {
    setSheetState(next);
    if (next) setSettled(false);
    else setTimeout(() => setSettled(true), SHEET_EXIT_MS);
  };
  const [lastCard, setLastCard] = useState<Card | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [doneOpen, setDoneOpen] = useState(false);

  const needs = useMemo(() => planNeeds(plan.targets, majors), [plan.targets, majors]);
  const systems = useMemo(() => planSystems(plan.targets), [plan.targets]);
  const names = useMemo(() => {
    const m = new Map<string, string>();
    for (const major of majors) for (const p of [major.uc, major.calState]) for (const r of p?.requirements ?? []) if (!m.has(r.topic)) m.set(r.topic, r.name);
    return m;
  }, [majors]);
  // The college's course for a course type when it has exactly one: the card's code and units until the student picks
  const defaultCourse = useMemo(() => {
    const list = courses.status === "ok" ? courses.data : [];
    return (topic: string): DefaultCourse | null => {
      const matches = list.filter((c) => c.topics.includes(topic));
      return matches.length === 1 ? { id: matches[0].id, code: matches[0].code, units: matches[0].units } : null;
    };
  }, [courses]);
  const current = currentTerm(today);
  const terms = useMemo(() => planTerms(current, transfer.term, settings.include_summer), [current, transfer.term, settings.include_summer]);
  const view = useMemo(
    () =>
      planView({
        needs, geAreas: data.geAreas, order: data.order, statuses, items, terms, settings, systems,
        nameOf: (t) => names.get(t) ?? t, newId: madeUpId, defaultCourse,
      }),
    [needs, data, statuses, items, terms, settings, systems, names, defaultCourse],
  );

  const college = plan.home?.name ?? null;
  const say = (message: string, undo?: () => void) => setToast({ message, undo, id: Date.now() });

  const sheetCard = sheet?.kind === "course" ? (view.cardsByKey.get(sheet.key) ?? null) : null;
  if (sheetCard && sheetCard !== lastCard) setLastCard(sheetCard);
  const shownCard = sheetCard ?? lastCard;
  const coursesFor = (card: Card | null): CollegeCourse[] =>
    card?.kind === "major" && courses.status === "ok" ? courses.data.filter((c) => c.topics.includes(card.topic!)) : [];

  // Builds or rebuilds. The first build can first mark what the student has finished (24 → 5).
  function build({ includeSummer = settings.include_summer, finished }: { includeSummer?: boolean; finished?: Set<string> } = {}) {
    let base = items;
    let known = statuses;
    let areasDone: StoredItem[] = [];
    if (finished?.size) {
      const marked = markFinished(items, [...view.cardsByKey.values()], finished);
      for (const t of marked.topics) setTopicStatus(t, "done");
      known = { ...statuses, ...Object.fromEntries(marked.topics.map((t) => [t, "done" as const])) };
      base = marked.items;
      areasDone = marked.areasDone;
    }
    const buildTerms = planTerms(current, transfer.term, includeSummer);
    const r = applyBuild(
      base,
      { majors: withDefaultUnits(needs, defaultCourse), geAreas: data.geAreas, statuses: known, terms: buildTerms, unitLimit: settings.units_per_term, order: data.order },
      () => crypto.randomUUID(),
    );
    saveItems(r.items, [...r.changed, ...areasDone.filter((a) => !r.changed.some((c) => c.id === a.id))], r.removed);
    say(view.built ? "Plan rebuilt" : "Plan built");
    noteBuilt();
  }

  // Moves a card and returns how to put it back
  function move(card: Card, to: TermId | null, beforeKey: string | null) {
    const before = beforeKey ? (view.cardsByKey.get(beforeKey)?.item.id ?? null) : null;
    const prev: StoredItem[] = items;
    const r = moveItem(prev, card.item, to, before);
    saveItems(r.items, r.changed);
    return () =>
      saveItems(
        prev,
        prev.filter((p) => r.changed.some((c) => c.id === p.id)),
        r.changed.filter((c) => !prev.some((p) => p.id === c.id)).map((c) => c.id),
      );
  }

  function changeStatus(card: Card, status: TopicStatus) {
    if (card.kind === "major") return setTopicStatus(card.topic!, status);
    if (status === "done" && card.progress !== "done") noteDoneMark();
    setItemStatus(card.item, status);
  }

  function checkFirst() {
    const at = view.firstCheck ? document.getElementById(`check-${view.firstCheck}`) : null;
    if (!at) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    at.scrollIntoView({ block: "center", behavior: still ? "auto" : "smooth" });
    at.querySelector<HTMLElement>(".card-tap")?.focus({ preventScroll: true });
  }

  const open = (card: Card) => setSheet({ kind: "course", key: card.key });
  const limit = settings.units_per_term;

  return (
    <>
      <div className="mx-4 mt-5">
        <PlanHero
          unitsDone={view.unitsDone}
          coursesLeft={view.coursesLeft}
          terms={terms.length}
          built={view.built}
          onBuild={() => setSheet({ kind: view.built ? "rebuild" : "finished" })}
        />
      </div>

      <div className="mt-4 flex flex-col items-start gap-1 px-6">
        <button type="button" onClick={() => setSheet({ kind: "settings" })} className="-my-[13px] py-[13px] text-blue-600 type-label pressed:underline focus-ring:underline">
          Units and terms
        </button>
        {view.checks > 0 && (
          <button type="button" onClick={checkFirst} className="-my-[13px] mt-2 py-[13px] text-left text-coral-700 type-label pressed:underline focus-ring:underline">
            {view.checks} {view.checks === 1 ? "thing" : "things"} to check
          </button>
        )}
        {view.doesntFit > 0 && (
          <div className="mt-2">
            <p className="text-coral-700 type-label">
              {view.doesntFit} {view.doesntFit === 1 ? "course doesn't" : "courses don't"} fit before {termInSentence(transfer.term)}.
            </p>
            <div className="mt-1 flex gap-5">
              {!settings.include_summer && (
                <button
                  type="button"
                  onClick={() => {
                    saveSettings({ include_summer: true });
                    build({ includeSummer: true });
                  }}
                  className="-my-[13px] py-[13px] text-blue-600 type-label pressed:underline focus-ring:underline"
                >
                  Add a summer
                </button>
              )}
              <button type="button" onClick={() => setSheet({ kind: "settings" })} className="-my-[13px] py-[13px] text-blue-600 type-label pressed:underline focus-ring:underline">
                Raise your units
              </button>
            </div>
          </div>
        )}
      </div>

      {view.done.length > 0 && (
        <section aria-label="Already done" className="mx-4 mt-6">
          <button
            type="button"
            aria-expanded={doneOpen}
            onClick={() => setDoneOpen((o) => !o)}
            className="flex min-h-11 w-full items-center gap-2 px-2 text-left text-navy-900 type-row-title focus-ring:outline-offset-0"
          >
            <span className="flex-1">Already done ({view.done.length})</span>
            <CaretDownIcon weight="bold" size={20} aria-hidden className={cn("text-slate-600 transition-transform duration-200 motion-reduce:transition-none", doneOpen && "rotate-180")} />
          </button>
          <Expand open={doneOpen}>
            <ul className="mt-2 divide-y-2 divide-border overflow-hidden rounded-lg border-2 border-border bg-surface">
              {view.done.map((c) => (
                <li key={c.key}>
                  <button type="button" onClick={() => open(c)} className="flex min-h-14 w-full items-center gap-3 px-4 py-2 text-left pressed:bg-surface-pressed focus-ring:-outline-offset-2">
                    <StatusIcon status="done" />
                    <span className="min-w-0 flex-1 text-navy-900">
                      {c.code && <span className="mr-1.5 type-code">{c.code}</span>}
                      <span className="type-row-title">{c.name}</span>
                    </span>
                    <span className="shrink-0 text-slate-600 tabular-nums type-label">{unitsShort(c)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Expand>
        </section>
      )}

      {!view.built ? (
        <p className="mt-6 px-6 text-slate-700 type-body">
          Build my plan puts the {view.coursesLeft} courses you still need into your {terms.length} {terms.length === 1 ? "term" : "terms"}, {limit} units at a time, and says
          why each one goes where it does. You can move any of them after.
        </p>
      ) : terms.length === 0 ? (
        <p className="mt-6 px-6 text-slate-700 type-body">There are no terms left before {termInSentence(transfer.term)}. Change your transfer term on the Deadlines screen.</p>
      ) : (
        <PlanBoard view={view} onOpen={open} onMove={(card, to, before) => move(card, to, before)} onAdd={(term) => setSheet({ kind: "custom", term })} />
      )}

      <CourseSheet
        open={sheet?.kind === "course" && sheetCard !== null}
        onClose={() => setSheet(null)}
        card={shownCard}
        college={college}
        courses={coursesFor(shownCard)}
        terms={terms}
        onStatus={changeStatus}
        onChoose={(card, c) => updateItem(card.item.id, { college_course_id: c.id, course_code: c.code, units: c.units }, card.item)}
        onType={(card, code, units) => {
          updateItem(card.item.id, { college_course_id: null, course_code: code, units }, card.item);
          if (plan.home) suggestCourse({ collegeId: plan.home.id, topic: card.topic, geArea: card.geArea, code, units });
        }}
        onMove={(card, to) => {
          const undo = move(card, to, null);
          setSheet(null);
          say(`Moved to ${to ? termLabel(to) : "Not in a term yet"}`, undo);
        }}
        onRemove={(card) => {
          const prev = items;
          saveItems(
            items.filter((i) => i.id !== card.item.id),
            [],
            [card.item.id],
          );
          setSheet(null);
          say("Course removed", () => saveItems(prev, [card.item]));
        }}
      />
      <SettingsSheet open={sheet?.kind === "settings"} onClose={() => setSheet(null)} settings={settings} firstTerm={terms[0] ?? null} onChange={saveSettings} />
      <CustomCourseSheet
        term={sheet?.kind === "custom" ? sheet.term : null}
        onClose={() => setSheet(null)}
        onAdd={(fields) => {
          addCustomCourse(fields);
          setSheet(null);
          say("Course added");
        }}
      />
      <FinishedSheet
        open={sheet?.kind === "finished"}
        onClose={() => setSheet(null)}
        cards={sheet?.kind === "finished" ? finishChoices(view) : []}
        unitsDone={settings.units_done}
        onBuild={(finished, unitsDone) => {
          if (unitsDone !== undefined && unitsDone !== settings.units_done) saveSettings({ units_done: unitsDone });
          setSheet(null);
          build({ finished });
        }}
        onSkip={() => {
          setSheet(null);
          build();
        }}
      />
      <ConfirmSheet
        open={sheet?.kind === "rebuild"}
        id="rebuild-title"
        title="Rebuild your plan?"
        body="Done, taking now and courses you placed yourself stay where they are. Everything else is placed again."
        confirm="Rebuild"
        cancel="Keep my plan"
        onConfirm={() => {
          setSheet(null);
          build();
        }}
        onClose={() => setSheet(null)}
      />
      {/* A toast never covers a sheet: it waits until the sheet has closed */}
      {toast && sheet === null && settled && (
        <Toast
          key={toast.id}
          message={toast.message}
          action={
            toast.undo
              ? {
                  label: "Undo",
                  onClick: () => {
                    toast.undo?.();
                    setToast(null);
                  },
                }
              : undefined
          }
          bottom={TAB_TOAST_BOTTOM}
          onDone={() => setToast(null)}
        />
      )}
    </>
  );
}
