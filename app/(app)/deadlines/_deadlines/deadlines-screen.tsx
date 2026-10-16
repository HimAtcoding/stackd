"use client";

import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import { BackButton } from "@/components/back-button";
import { RemindersAsk } from "@/components/deadlines/reminders-ask";
import { RemindersCard } from "@/components/deadlines/reminders-card";
import { DemoStrip } from "@/components/ui/demo-strip";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineError } from "@/components/ui/inline-error";
import { Loading } from "@/components/ui/loading";
import { TintedButton } from "@/components/ui/tinted-button";
import { Toast } from "@/components/ui/toast";
import { UnofficialFooter } from "@/components/ui/unofficial-footer";
import { GoHome } from "@/components/unbuilt-route";
import { markDeadline, remindersFor, retryDeadlines, saveTerm, setReminders, useDeadlines, useScope } from "@/lib/data/deadlines";
import { retryPlan } from "@/lib/data/plan";
import { cycleLabel, nextCycle, sourceLine, type Deadline } from "@/lib/deadlines";
import { FEATURES } from "@/lib/features";
import { onboardingUrl } from "@/lib/onboarding";
import { dismissRemindersCard, turnOnReminders, useReminders } from "@/lib/reminders";
import { DateSheet } from "./date-sheet";
import { NextUpCard } from "./next-up-card";
import { TermQuestion, TermSheet } from "./term-question";
import { DonePast, Timeline } from "./timeline";

const TOAST_BOTTOM = "calc(var(--safe-bottom) + 12px)";
const COLLAPSE = { duration: 0.24, ease: [0.2, 0.8, 0.2, 1] } as const;
// A date marked done keeps its row long enough for the green node to land, then the row folds away
const SETTLE_MS = 400;

// The Deadlines screen exists only with its flag on; otherwise the address goes Home (13: no dead ends)
export function DeadlinesRoute({ husky }: { husky: ReactNode }) {
  if (!FEATURES.deadlines) return <GoHome />;
  return <DeadlinesScreen husky={husky} />;
}

type SheetState = { id: string; open: boolean; reminders: boolean };

function DeadlinesScreen({ husky }: { husky: ReactNode }) {
  const scope = useScope();
  const state = useDeadlines(scope);
  // ?id= from a reminder opens that date's sheet on arrival
  const arrivalId = useSearchParams().get("id");
  const [sheet, setSheet] = useState<SheetState | null>(arrivalId ? { id: arrivalId, open: true, reminders: false } : null);
  const [termSheet, setTermSheet] = useState(false);
  const [toast, setToast] = useState<{ key: number; text: string; undo?: string } | null>(null);
  const [settling, setSettling] = useState<string[]>([]);
  const reminders = useReminders();
  // The soft ask is open; `then` runs once the student has answered it (allowed or not)
  const [asking, setAsking] = useState<{ then?: (allowed: boolean) => void } | null>(null);

  const remindersOnToast = () => setToast({ key: Date.now(), text: "Reminders on" });

  // 14 → Permission flow, step 2: iOS's own prompt. Allowed: reminders on for every tracked date.
  async function allowReminders() {
    const then = asking?.then;
    setAsking(null);
    const allowed = (await turnOnReminders()) === "granted";
    if (allowed) remindersOnToast();
    then?.(allowed);
  }

  function notNow() {
    const then = asking?.then;
    setAsking(null);
    then?.(false);
  }

  // The reminders card's "Turn on reminders"
  async function turnOnFromCard() {
    if (reminders.permission === "prompt") return setAsking({});
    if ((await turnOnReminders()) === "granted") remindersOnToast();
  }

  // "Remind me": the date's sheet at Reminders, after the soft ask while iOS hasn't asked yet
  function remind(id: string) {
    const openSheet = () => setSheet({ id, open: true, reminders: true });
    if (reminders.permission === "prompt") setAsking({ then: (allowed) => allowed && openSheet() });
    else openSheet();
  }

  // A reminder choice saves at once. While iOS hasn't asked, the soft ask comes first and the sheet comes back after;
  // with permission already given, choosing a reminder turns reminders back on if they were off.
  async function chooseReminders(id: string, days: number[]) {
    setReminders(id, days);
    if (reminders.permission === "prompt") {
      setSheet((s) => (s ? { ...s, open: false } : s));
      setAsking({ then: () => setSheet({ id, open: true, reminders: true }) });
    } else if (reminders.permission === "granted" && !reminders.on && days.length > 0) {
      if ((await turnOnReminders()) === "granted") remindersOnToast();
    }
  }

  function markDone(id: string, done: boolean, withToast: boolean) {
    markDeadline(id, done);
    try {
      navigator.vibrate?.(10);
    } catch {}
    if (done) {
      setSettling((ids) => [...ids, id]);
      setTimeout(() => setSettling((ids) => ids.filter((x) => x !== id)), SETTLE_MS);
    }
    setToast(done && withToast ? { key: Date.now(), text: "Marked done", undo: id } : null);
  }

  function chooseTerm(term: string | null) {
    saveTerm(term);
    setTermSheet(false);
    setToast({ key: Date.now(), text: "Transfer term saved" });
  }

  const ok = state.status === "ok" ? state : null;
  const all = ok ? [...ok.view.upcoming, ...ok.view.finished] : [];
  const find = (id: string | undefined): Deadline | null => all.find((d) => d.id === id) ?? null;
  const next = ok?.view.upcoming[0];
  const timelineRows = ok
    ? [...ok.view.upcoming, ...ok.view.finished.filter((d) => settling.includes(d.id))].sort((a, b) => a.due_at.localeCompare(b.due_at))
    : [];
  const finished = ok ? ok.view.finished.filter((d) => !settling.includes(d.id)) : [];
  const cycle = ok ? cycleLabel(ok.view.cycle) : "";
  // Shown once, until reminders have been on or the card is closed. Hidden when iOS permission is denied, since
  // its button couldn't do anything; Settings explains that case.
  const showRemindersCard =
    FEATURES.reminders && reminders.supported && !reminders.everOn && !reminders.dismissed && reminders.permission !== "denied";

  return (
    <div className="min-h-dvh bg-sky-50">
      {ok?.view.demo && <DemoStrip />}
      <main
        className="mx-auto max-w-[480px]"
        style={{ paddingTop: "calc(var(--safe-top) + var(--strip-h) + 8px)", paddingBottom: "calc(var(--safe-bottom) + 24px)" }}
      >
        <div className="px-4">
          <BackButton fallback="/" slideBack />
        </div>
        <h1 className="mt-6 px-6 text-navy-900 type-title-1">Deadlines</h1>

        {state.status === "loading" && (
          <div className="pt-12">
            <Loading label="Loading deadlines" />
          </div>
        )}

        {state.status === "error" && (
          <div className="mx-4 mt-6">
            <InlineError
              title="Couldn't load deadlines"
              body="Check your connection, then try again."
              action={
                <TintedButton
                  onClick={() => {
                    retryPlan();
                    retryDeadlines();
                  }}
                >
                  Try again
                </TintedButton>
              }
            />
          </div>
        )}

        {ok && (
          <MotionConfig reducedMotion="user">
            {/* The term question takes the term line's place until it's answered, then folds into it */}
            <AnimatePresence initial={false}>
              {ok.term.asked ? (
                <p key="line" className="mt-1 flex items-baseline gap-2 px-6 text-slate-600 type-body">
                  {cycle} transfer
                  <button
                    type="button"
                    onClick={() => setTermSheet(true)}
                    aria-label={`Change transfer term, now ${cycle}`}
                    className="-my-[13px] py-[13px] text-blue-600 type-label pressed:underline focus-ring:underline"
                  >
                    Change
                  </button>
                </p>
              ) : (
                <motion.div key="question" exit={{ height: 0, opacity: 0 }} transition={COLLAPSE} className="overflow-hidden">
                  <div className="mx-4 mt-6">
                    <TermQuestion onChoose={chooseTerm} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!ok.scope && (
              <section aria-labelledby="no-plan-title" className="mx-4 mt-6 rounded-lg bg-surface p-4 shadow-card">
                <h2 id="no-plan-title" className="text-navy-900 type-headline">
                  See only your dates
                </h2>
                <p className="mt-1 text-slate-600 type-body">Pick your schools and Stackd shows just their deadlines.</p>
                <TintedButton href={onboardingUrl("college", { from: "home" })} className="mt-3">
                  Set up your plan
                </TintedButton>
              </section>
            )}

            {next ? (
              <>
                <div className="mx-4 mt-6">
                  <NextUpCard
                    deadline={next}
                    now={ok.now}
                    scope={ok.scope}
                    remindersOn={reminders.active && remindersFor(ok.marks[next.id], reminders.days).length > 0}
                    onRemind={() => remind(next.id)}
                    onMarkDone={() => markDone(next.id, true, true)}
                  />
                </div>
                {showRemindersCard && (
                  <div className="mx-4 mt-6">
                    <RemindersCard onTurnOn={turnOnFromCard} onDismiss={dismissRemindersCard} />
                  </div>
                )}
              </>
            ) : all.length > 0 ? (
              <EmptyState
                icon={husky}
                title="You're all caught up"
                body={`No more deadlines this cycle. We'll add ${cycleLabel(nextCycle(ok.view.cycle)).toLowerCase()} dates when schools publish them.`}
              />
            ) : (
              <p className="mt-6 px-6 text-slate-600 type-body">
                No deadlines coming up for {cycle.toLowerCase()}. We add the next cycle when schools publish their dates.
              </p>
            )}

            <div className="mt-6">
              <Timeline rows={timelineRows} scope={ok.scope} onOpen={(id) => setSheet({ id, open: true, reminders: false })} />
            </div>
            <DonePast rows={finished} scope={ok.scope} onOpen={(id) => setSheet({ id, open: true, reminders: false })} />

            {all.length > 0 && <p className="mt-6 max-w-[368px] px-6 text-slate-600 type-caption">{sourceLine(all)}</p>}
          </MotionConfig>
        )}

        <UnofficialFooter className="mt-4 px-4" />
      </main>

      {ok && (
        <>
          <DateSheet
            open={Boolean(sheet?.open && find(sheet.id))}
            deadline={find(sheet?.id)}
            mark={sheet ? ok.marks[sheet.id] : undefined}
            scope={ok.scope}
            focusReminders={Boolean(sheet?.reminders)}
            reminders={{
              defaults: reminders.days,
              denied: reminders.permission === "denied",
              onChoose: (days) => {
                if (sheet) chooseReminders(sheet.id, days);
              },
            }}
            onClose={() => setSheet((s) => (s ? { ...s, open: false } : s))}
            onMarkDone={(done) => sheet && markDone(sheet.id, done, false)}
          />
          <TermSheet open={termSheet} onClose={() => setTermSheet(false)} term={ok.term.term} onChoose={chooseTerm} />
          {reminders.supported && <RemindersAsk open={asking !== null} onAllow={allowReminders} onClose={notNow} />}
        </>
      )}

      {toast && (
        <Toast
          key={toast.key}
          message={toast.text}
          action={
            toast.undo
              ? {
                  label: "Undo",
                  onClick: () => {
                    if (toast.undo) markDeadline(toast.undo, false);
                    setToast(null);
                  },
                }
              : undefined
          }
          bottom={TOAST_BOTTOM}
          onDone={() => setToast(null)}
        />
      )}
    </div>
  );
}
