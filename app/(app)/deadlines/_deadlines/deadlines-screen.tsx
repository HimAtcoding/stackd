"use client";

import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { BellIcon, BellRingingIcon, CheckIcon } from "@phosphor-icons/react/ssr";
import { BackButton } from "@/components/back-button";
import { RemindersAsk } from "@/components/deadlines/reminders-ask";
import { RemindersCard } from "@/components/deadlines/reminders-card";
import { TurnOnConfirm } from "@/components/deadlines/turn-on-confirm";
import { CompactButton } from "@/components/ui/compact-button";
import { CycleBar } from "@/components/ui/cycle-bar";
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
import { cn } from "@/lib/cn";
import { cycleBar, cycleLabel, nextCycle, nextDueLine, SOON_DAYS, sourceLine, type Deadline } from "@/lib/deadlines";
import { FEATURES } from "@/lib/features";
import { onboardingUrl } from "@/lib/onboarding";
import { dismissRemindersCard, turnOnReminders, useReminders } from "@/lib/reminders";
import { afterReminderChoice, onReminderTap } from "@/lib/reminders/choice";
import { DateSheet } from "./date-sheet";
import { TermQuestion, TermSheet } from "./term-question";
import { DonePast, Timeline } from "./timeline";

const TOAST_BOTTOM = "calc(var(--safe-bottom) + 12px)";
const COLLAPSE = { duration: 0.24, ease: [0.2, 0.8, 0.2, 1] } as const;
// A date marked done keeps its row while its buttons fade out, then the row folds away (15 → The next row opens)
const SETTLE_MS = 120;

// The Deadlines screen exists only with its flag on; otherwise the address goes Home (13: no dead ends)
export function DeadlinesRoute({ husky }: { husky: ReactNode }) {
  if (!FEATURES.deadlines) return <GoHome />;
  return <DeadlinesScreen husky={husky} />;
}

type SheetState = { id: string; open: boolean; reminders: boolean };

function DeadlinesScreen({ husky }: { husky: ReactNode }) {
  const scope = useScope();
  const state = useDeadlines(scope);
  // ?id= from a reminder opens that date's sheet, on arrival and on every later navigation to another date
  const arrivalId = useSearchParams().get("id");
  const [sheet, setSheet] = useState<SheetState | null>(arrivalId ? { id: arrivalId, open: true, reminders: false } : null);
  const [seenId, setSeenId] = useState(arrivalId);
  if (arrivalId !== seenId) {
    setSeenId(arrivalId);
    if (arrivalId) setSheet({ id: arrivalId, open: true, reminders: false });
  }
  // A reminder tapped while this screen is open, even for the date already in the address
  useEffect(() => onReminderTap((id) => setSheet({ id, open: true, reminders: false })), []);
  const [termSheet, setTermSheet] = useState(false);
  const [toast, setToast] = useState<{ key: number; text: string; undo?: string } | null>(null);
  const [settling, setSettling] = useState<string[]>([]);
  const reminders = useReminders();
  // The soft ask is open; `then` runs once the student has answered it (allowed or not)
  const [asking, setAsking] = useState<{ then?: (allowed: boolean) => void } | null>(null);
  // "Turn on reminders?" is open; `then` brings the date's sheet back
  const [confirming, setConfirming] = useState<{ then: () => void } | null>(null);
  const still = useReducedMotion();

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

  // A reminder choice saves at once. While iOS hasn't asked, the soft ask comes first; when reminders are off in
  // Settings, adding a day asks before turning them on for every date. Either way the sheet comes back after.
  function chooseReminders(id: string, days: number[]) {
    const before = remindersFor(state.status === "ok" ? state.marks[id] : undefined, reminders.days);
    setReminders(id, days);
    const next = afterReminderChoice({ permission: reminders.permission, on: reminders.on, before, after: days });
    if (next === "save") return;
    const backToSheet = () => setSheet({ id, open: true, reminders: true });
    setSheet((s) => (s ? { ...s, open: false } : s));
    if (next === "soft-ask") setAsking({ then: backToSheet });
    else setConfirming({ then: backToSheet });
  }

  async function confirmTurnOn() {
    const then = confirming?.then;
    setConfirming(null);
    if ((await turnOnReminders()) === "granted") remindersOnToast();
    then?.();
  }

  function declineTurnOn() {
    const then = confirming?.then;
    setConfirming(null);
    then?.();
  }

  function markDone(id: string, done: boolean, withToast: boolean) {
    markDeadline(id, done);
    try {
      navigator.vibrate?.(10);
    } catch {}
    if (done) {
      setSettling((ids) => [...ids, id]);
      // Reduced motion: no collapse, the row swaps out at once
      setTimeout(() => setSettling((ids) => ids.filter((x) => x !== id)), still ? 0 : SETTLE_MS);
    }
    setToast((t) => (done && withToast ? { key: (t?.key ?? 0) + 1, text: "Marked done", undo: id } : null));
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
  const bar = ok ? cycleBar(ok.view.upcoming, ok.now) : null;
  // The panel's color, by the same rule as Home's hero: coral when the next date is 14 days or less away
  const panel = next && next.daysLeft <= SOON_DAYS ? "coral" : "blue";
  const remindersOn = (id: string) => Boolean(ok && reminders.active && remindersFor(ok.marks[id], reminders.days).length > 0);

  // The next row's buttons (15 → The next row opens)
  // Mark done first as the one solid action, then Remind me as a text button (16 → Open row actions)
  const rowActions = (d: Deadline) => (
    <>
      <CompactButton
        variant="solid"
        icon={<CheckIcon weight="bold" size={16} aria-hidden />}
        onClick={() => markDone(d.id, true, true)}
        aria-label={`Mark ${d.title} done`}
      >
        Mark done
      </CompactButton>
      {FEATURES.reminders && (
        <CompactButton
          variant="text"
          icon={remindersOn(d.id) ? <BellRingingIcon weight="fill" size={16} aria-hidden /> : <BellIcon weight="bold" size={16} aria-hidden />}
          onClick={() => remind(d.id)}
          aria-label={`${remindersOn(d.id) ? "Reminders on" : "Remind me"}: ${d.title}`}
        >
          {remindersOn(d.id) ? "Reminders on" : "Remind me"}
        </CompactButton>
      )}
    </>
  );
  // Shown once, until reminders have been on or the card is closed. Hidden when iOS permission is denied, since
  // its button couldn't do anything; Settings explains that case.
  const showRemindersCard =
    FEATURES.reminders && reminders.supported && !reminders.everOn && !reminders.dismissed && reminders.permission !== "denied";

  return (
    <div className="min-h-dvh overflow-x-clip bg-sky-50">
      {ok?.view.demo && <DemoStrip />}
      <main className="mx-auto max-w-[480px]" style={{ paddingBottom: "calc(var(--safe-bottom) + 24px)" }}>
        {/* The Deadlines panel (16 → Deadlines panel) continues Home's hero: blue, or coral when the next date is 14 days
            or less away, the screen's full width with 28 bottom corners, every word white. It holds the term, what's
            next and the year bar, and ends 24 below the bar's labels. Focus outlines are white on it. */}
        <header className="relative pb-6 text-white" style={{ paddingTop: "calc(var(--safe-top) + var(--strip-h) + 8px)" }}>
          <span aria-hidden className={cn("absolute inset-y-0 left-1/2 w-screen -translate-x-1/2 rounded-b-[28px]", panel === "coral" ? "bg-coral-700" : "bg-blue-600")} />
          <div className="relative px-4 [&_a:focus-visible]:outline-white [&_button:focus-visible]:outline-white">
            <BackButton fallback="/" slideBack />
          </div>
          <h1 className="relative mt-6 px-6 type-title-1">Deadlines</h1>
          {ok?.term.asked && (
            <p className="relative mt-1 flex items-baseline gap-2 px-6 type-body">
              {cycle} transfer
              <button
                type="button"
                onClick={() => setTermSheet(true)}
                aria-label={`Change transfer term, now ${cycle}`}
                className="-my-[13px] py-[13px] underline type-label focus-ring:outline-white"
              >
                Change
              </button>
            </p>
          )}
          {ok && (
            <MotionConfig reducedMotion="user">
              {/* Before a term is chosen, its question takes the next line's place, as a surface card on the panel */}
              <AnimatePresence initial={false}>
                {!ok.term.asked && (
                  <motion.div key="question" exit={{ height: 0, opacity: 0 }} transition={COLLAPSE} className="relative overflow-hidden">
                    <div className="mx-4 mt-6">
                      <TermQuestion onChoose={chooseTerm} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </MotionConfig>
          )}
          {ok?.term.asked && next && (
            <div className="relative mt-6 px-6">
              <p className="type-headline">{next.title} is next</p>
              <p className="mt-1 type-body">{nextDueLine(next)}</p>
              {bar && <CycleBar view={bar} panel={panel} className="mt-4" />}
            </div>
          )}
        </header>

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
            {!ok.scope && (
              <section aria-labelledby="no-plan-title" className="mx-4 mt-6 rounded-md border border-border bg-surface p-4">
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
              showRemindersCard && (
                <div className="mx-4 mt-6">
                  <RemindersCard onTurnOn={turnOnFromCard} onDismiss={dismissRemindersCard} />
                </div>
              )
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

            {/* The first month header's own 24 is the space between the panel and the timeline */}
            <Timeline rows={timelineRows} scope={ok.scope} actions={rowActions} onOpen={(id) => setSheet({ id, open: true, reminders: false })} />
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
          {reminders.supported && <TurnOnConfirm open={confirming !== null} onTurnOn={confirmTurnOn} onClose={declineTurnOn} />}
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
