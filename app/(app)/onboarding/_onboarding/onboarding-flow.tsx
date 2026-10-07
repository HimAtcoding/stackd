"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ViewTransition, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { WarningCircleIcon } from "@phosphor-icons/react/ssr";
import { BackButton, canGoBack } from "@/components/back-button";
import { FlashToast } from "@/components/flash-toast";
import { ChoiceList, ChoiceRow } from "@/components/ui/choice-row";
import { Expand } from "@/components/ui/expand";
import { InlineError } from "@/components/ui/inline-error";
import { Loading } from "@/components/ui/loading";
import { PinnedBottom } from "@/components/ui/pinned-bottom";
import { PrimaryButton } from "@/components/ui/primary-button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SearchField } from "@/components/ui/search-field";
import { TextLink } from "@/components/ui/text-link";
import { TintedButton } from "@/components/ui/tinted-button";
import { getInstitutions, getMajors, type Institution, type Major } from "@/lib/data/catalog";
import { fetchPlan, savePlan, type Plan } from "@/lib/data/plan";
import { DEMO_MODE } from "@/lib/flags";
import { setFlash } from "@/lib/flash";
import { degreeLabel } from "@/lib/format";
import { onboardingUrl, type OnboardingFrom, type OnboardingStep } from "@/lib/onboarding";
import { useLoaded } from "@/lib/use-loaded";

const STEPS: OnboardingStep[] = ["college", "schools", "major"];
// The "isn't listed" rows: an answer, but with nothing to save
const NOT_LISTED = "not-listed";

const COPY: Record<OnboardingStep, { question: string; helper: string; search: string; things: string; missing: string }> = {
  college: {
    question: "Where do you go now?",
    helper: "Pick your community college.",
    search: "Search colleges",
    things: "colleges",
    missing: `Pick your college, or choose "My college isn't listed."`,
  },
  schools: {
    question: "Where do you want to transfer?",
    helper: "Pick one or more schools. You can change this later.",
    search: "Search schools",
    things: "schools",
    missing: "Pick at least one school.",
  },
  major: {
    question: "What's your major?",
    helper: "Pick the major you plan to transfer into.",
    search: "Search majors",
    things: "majors",
    missing: 'Pick a major for each school, or choose "Not listed yet."',
  },
};

type School = { id: string; name: string };

// Matches the name and the city, ignoring case and spaces
const squash = (text: string) => text.toLowerCase().replace(/\s+/g, "");
const matches = (query: string, ...fields: (string | null)[]) => {
  const q = squash(query);
  return !q || fields.some((f) => f && squash(f).includes(q));
};

const subscribeMotion = (onChange: () => void) => {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
};
const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// 10: three questions on one route, so the answers stay in memory while ?step= changes.
// First run saves everything at the end; a Settings edit (?edit=1) opens one step and saves only that.
export function OnboardingFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const stepParam = params.get("step") as OnboardingStep;
  const step = STEPS.includes(stepParam) ? stepParam : "college";
  const edit = params.get("edit") === "1";
  const fromParam = params.get("from") as OnboardingFrom;
  const from: OnboardingFrom = edit ? "settings" : (["signup", "home", "settings"] as const).includes(fromParam) ? fromParam : "home";
  const index = STEPS.indexOf(step);
  const copy = COPY[step];

  const [college, setCollege] = useState<string | null>(null);
  // In the order they were chosen
  const [schools, setSchools] = useState<School[]>([]);
  // School id → major id, or NOT_LISTED
  const [majors, setMajors] = useState<Record<string, string>>({});
  const [search, setSearch] = useState({ step, text: "" });
  const [missingOn, setMissingOn] = useState<OnboardingStep | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const listsRef = useRef<HTMLDivElement>(null);
  // Steps this screen opened itself, so Back can use history
  const opened = useRef(new Set<OnboardingStep>());
  const reducedMotion = useSyncExternalStore(subscribeMotion, prefersReducedMotion, () => false);

  // A Settings edit starts from the saved answers
  const [saved, retrySaved] = useLoaded<Plan>(edit ? "plan" : null, fetchPlan);
  const [prefilled, setPrefilled] = useState(false);
  if (edit && !prefilled && saved.status === "ok") {
    setPrefilled(true);
    setCollege(saved.data.home?.id ?? NOT_LISTED);
    setSchools(saved.data.targets.map((t) => ({ id: t.institutionId, name: t.name })));
    // A school with no major picked yet (added later from Settings) starts with nothing chosen
    setMajors(
      Object.fromEntries(saved.data.targets.flatMap((t) => (t.majorId ? [[t.institutionId, t.majorId]] : t.majorNotListed ? [[t.institutionId, NOT_LISTED]] : []))),
    );
  }

  const [colleges, retryColleges] = useLoaded<Institution[]>(step === "college" ? "colleges" : null, () => getInstitutions("community_college"));
  const [universities, retryUniversities] = useLoaded<Institution[]>(step === "schools" ? "universities" : null, () => getInstitutions("university"));
  const schoolIds = schools.map((s) => s.id);
  const [majorList, retryMajors] = useLoaded<Major[]>(
    step === "major" && schools.length > 0 ? `majors:${[...schoolIds].sort().join(",")}` : null,
    () => getMajors(schoolIds),
  );

  // A step that needs earlier answers which aren't in memory (a reload) starts over; demo mode has no accounts to save to
  const lost = !edit && step !== "college" && (college === null || (step === "major" && schools.length === 0));
  const emptyEdit = edit && step === "major" && saved.status === "ok" && saved.data.targets.length === 0;
  useEffect(() => {
    if (DEMO_MODE) router.replace("/");
    else if (lost) router.replace(onboardingUrl("college", { from }));
    else if (emptyEdit) router.replace("/settings/");
  }, [lost, emptyEdit, from, router]);

  // The new question takes focus on each step change, and the page starts from the top
  const shownStep = useRef(step);
  useEffect(() => {
    if (shownStep.current === step) return;
    shownStep.current = step;
    window.scrollTo(0, 0);
    headingRef.current?.focus({ preventScroll: true });
  }, [step]);

  if (DEMO_MODE || lost || emptyEdit) return null;

  const query = search.step === step ? search.text : "";
  const missing = missingOn === step;

  function choose(update: () => void) {
    if (saving) return;
    update();
    setMissingOn(null);
    setSaveFailed(false);
  }

  function toggleSchool(school: School) {
    choose(() => setSchools((prev) => (prev.some((s) => s.id === school.id) ? prev.filter((s) => s.id !== school.id) : [...prev, school])));
  }

  function goTo(next: OnboardingStep) {
    opened.current.add(next);
    window.history.pushState(null, "", onboardingUrl(next, { from }));
  }

  function backOneStep() {
    if (opened.current.has(step)) window.history.back();
    else window.history.replaceState(null, "", onboardingUrl(STEPS[index - 1], { from }));
  }

  // Checked on tap, not while choosing. Focus goes to the first row, or on step 3 to the first school without a choice.
  function firstUnanswered(): string | null {
    if (step === "college") return college === null ? "[role=radio]" : null;
    if (step === "schools") return schools.length === 0 ? "[role=checkbox]" : null;
    const open = schools.find((s) => !majors[s.id]);
    return open ? `[data-school="${open.id}"] [role=radio]` : null;
  }

  async function save(change: Parameters<typeof savePlan>[0], then: () => void) {
    setSaveFailed(false);
    setSaving(true);
    if (await savePlan(change)) {
      setFlash("Plan saved");
      return then();
    }
    setSaving(false);
    setSaveFailed(true);
  }

  // Each school with its answer: a major, "Not listed yet", or nothing yet (a school just added from Settings)
  const chosenTargets = () =>
    schools.map((s) => {
      const notListed = majors[s.id] === NOT_LISTED;
      return { institutionId: s.id, majorId: notListed ? null : (majors[s.id] ?? null), majorNotListed: notListed };
    });
  const homeChoice = { id: college === NOT_LISTED ? null : college };

  function onContinue() {
    if (saving) return;
    const unanswered = firstUnanswered();
    if (unanswered) {
      setMissingOn(step);
      listsRef.current?.querySelector<HTMLElement>(unanswered)?.focus();
      return;
    }
    if (edit) {
      const backToSettings = () => (canGoBack() ? router.back() : router.replace("/settings/"));
      if (step === "college") return save({ home: homeChoice }, backToSettings);
      // Editing schools: one kept from before keeps its major, and a newly added one has none yet
      return save({ targets: chosenTargets() }, backToSettings);
    }
    if (step !== "major") return goTo(STEPS[index + 1]);
    save({ home: homeChoice, targets: chosenTargets() }, () => router.replace("/", { transitionTypes: ["crossfade"] }));
  }

  const waiting = edit && saved.status !== "ok";
  const list = step === "college" ? colleges : step === "schools" ? universities : majorList;
  const status = waiting ? saved.status : list.status;
  const retry = () => {
    if (waiting) retrySaved();
    else if (step === "college") retryColleges();
    else if (step === "schools") retryUniversities();
    else retryMajors();
  };

  // Nothing matches the search; or, with no search, the database has none yet
  const noMatch = (
    <p className="mx-6 mt-3 text-slate-600 type-body">
      {query.trim() ? `No ${copy.things} match "${query.trim()}".` : `No ${copy.things} listed yet.`}
    </p>
  );
  const note = (text: string) => <p className="mx-6 mt-3 max-w-[320px] text-slate-600 type-caption">{text}</p>;

  let lists = null;
  if (status === "loading") {
    lists = (
      <div className="mt-8">
        <Loading label={`Loading ${copy.things}`} />
      </div>
    );
  } else if (status === "error") {
    lists = (
      <div className="mx-4 mt-3">
        <InlineError
          title={`Couldn't load ${copy.things}`}
          body="Check your connection, then try again."
          action={<TintedButton onClick={retry}>Try again</TintedButton>}
        />
      </div>
    );
  } else if (step === "college" && colleges.status === "ok") {
    const rows = colleges.data.filter((c) => matches(query, c.name, c.city));
    lists = (
      <>
        {rows.length === 0 && noMatch}
        <ChoiceList role="radiogroup" aria-label="Your college" readOnly={saving} className="mx-4 mt-3">
          {rows.map((c) => (
            <ChoiceRow key={c.id} role="radio" checked={college === c.id} name={c.name} detail={c.city} readOnly={saving} onSelect={() => choose(() => setCollege(c.id))} />
          ))}
          <ChoiceRow role="radio" checked={college === NOT_LISTED} name="My college isn't listed" readOnly={saving} onSelect={() => choose(() => setCollege(NOT_LISTED))} />
        </ChoiceList>
        {college === NOT_LISTED && note("We're starting with a few colleges and adding more. You can still save schools and deadlines.")}
      </>
    );
  } else if (step === "schools" && universities.status === "ok") {
    const rows = universities.data.filter((u) => matches(query, u.name, u.city));
    lists = (
      <>
        {rows.length === 0 ? (
          noMatch
        ) : (
          <ChoiceList role="group" aria-label="Schools you want to transfer to" readOnly={saving} className="mx-4 mt-3">
            {rows.map((u) => (
              <ChoiceRow
                key={u.id}
                role="checkbox"
                checked={schools.some((s) => s.id === u.id)}
                name={u.name}
                detail={u.city}
                readOnly={saving}
                onSelect={() => toggleSchool({ id: u.id, name: u.name })}
              />
            ))}
          </ChoiceList>
        )}
        {schools.length > 0 && <p className="mx-6 mt-3 text-slate-600 tabular-nums type-caption">{schools.length} selected</p>}
      </>
    );
  } else if (step === "major" && majorList.status === "ok") {
    const several = schools.length > 1;
    lists = schools.map((school, i) => {
      const rows = majorList.data.filter((m) => m.institutionId === school.id && matches(query, m.name));
      return (
        <section key={school.id} data-school={school.id}>
          {several && <h2 className={`mx-6 text-navy-900 type-title-3 ${i === 0 ? "mt-5" : "mt-6"}`}>{school.name}</h2>}
          {!several && rows.length === 0 && noMatch}
          <ChoiceList role="radiogroup" aria-label={`Your major at ${school.name}`} readOnly={saving} className="mx-4 mt-3">
            {rows.map((m) => (
              <ChoiceRow
                key={m.id}
                role="radio"
                checked={majors[school.id] === m.id}
                name={m.name}
                detail={degreeLabel(m.degreeType)}
                readOnly={saving}
                onSelect={() => choose(() => setMajors((prev) => ({ ...prev, [school.id]: m.id })))}
              />
            ))}
            <ChoiceRow
              role="radio"
              checked={majors[school.id] === NOT_LISTED}
              name="Not listed yet"
              readOnly={saving}
              onSelect={() => choose(() => setMajors((prev) => ({ ...prev, [school.id]: NOT_LISTED })))}
            />
          </ChoiceList>
          {majors[school.id] === NOT_LISTED && note("We'll add more majors. Your school is still saved.")}
        </section>
      );
    });
  }

  const helper = step === "major" && schools.length === 1 ? `Pick the major you plan to transfer into at ${schools[0].name}.` : copy.helper;
  // No Back on step 1 straight after sign-up: there's nothing to go back to
  const showBack = edit || index > 0 || from !== "signup";
  const showSkip = !edit && from !== "settings";
  const fade = reducedMotion ? "none" : "auto";

  return (
    <div className="flex flex-1 flex-col" style={{ paddingTop: "calc(var(--safe-top) + 8px)" }}>
      <header className="flex h-11 items-center gap-4 px-4">
        {showBack &&
          (edit || index === 0 ? (
            <BackButton fallback={from === "home" ? "/" : "/settings/"} />
          ) : (
            <BackButton fallback="/" onBack={backOneStep} />
          ))}
        {!edit && (
          <div className="relative flex-1">
            <ProgressBar value={index + 1} max={3} label={`Step ${index + 1} of 3`} />
            <p aria-hidden className="absolute left-0 top-full mt-1 text-slate-600 tabular-nums type-caption">
              Step {index + 1} of 3
            </p>
          </div>
        )}
        {showSkip && (
          <TextLink href="/" replace size="label" className="-mx-2.5 px-2.5">
            Skip
          </TextLink>
        )}
      </header>

      <ViewTransition key={step} enter={fade} exit={fade}>
        {/* 24 under the step count, which ends 2 below the header row; 24 of room at the end clears the button's fade */}
        <div className={`flex-1 pb-6 ${edit ? "pt-6" : "pt-[26px]"}`}>
          <h1 ref={headingRef} tabIndex={-1} className="mx-6 max-w-[320px] text-navy-900 outline-none type-title-1">
            {copy.question}
          </h1>
          <p className="mx-6 mt-2 max-w-[320px] text-slate-600 type-body-md">{helper}</p>
          <SearchField
            id="onboarding-search"
            className="mx-4 mt-5"
            placeholder={copy.search}
            value={query}
            readOnly={saving}
            onChange={(text) => setSearch({ step, text })}
          />
          <div ref={listsRef}>{lists}</div>
        </div>
      </ViewTransition>

      <PinnedBottom>
        <Expand open={missing || saveFailed}>
          <div className="pb-3">
            {saveFailed ? (
              <InlineError role="alert" title="Couldn't save your plan" body="Check your connection, then try again." />
            ) : (
              <p role="alert" className="flex items-start gap-1.5 px-2 text-coral-700 type-label font-medium">
                <WarningCircleIcon weight="fill" size={16} aria-hidden className="mt-px shrink-0" />
                <span>{copy.missing}</span>
              </p>
            )}
          </div>
        </Expand>
        <PrimaryButton loading={saving} onClick={onContinue}>
          {edit || step === "major" ? "Save plan" : "Continue"}
        </PrimaryButton>
      </PinnedBottom>

      {/* "Email confirmed", arriving from Enter code (09): 12 above the pinned button */}
      <FlashToast bottom="calc(var(--safe-bottom) + 16px + 56px + 12px)" />
    </div>
  );
}
