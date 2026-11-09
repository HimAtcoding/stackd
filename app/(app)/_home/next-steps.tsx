"use client";

import { useState, type ReactNode } from "react";
import { AfterWait } from "@/components/deadlines/after-wait";
import { useReminderPrompts } from "@/components/deadlines/reminder-prompts";
import { Hero } from "@/components/ui/hero";
import { PrimaryButton } from "@/components/ui/primary-button";
import { SecondaryButton } from "@/components/ui/secondary-button";
import { StepPath } from "@/components/ui/step-path";
import { TextLink } from "@/components/ui/text-link";
import { Toast } from "@/components/ui/toast";
import { WindowBar } from "@/components/ui/window-bar";
import { checklistCelebrated, claimChecklistReady } from "@/lib/celebration";
import { markDeadline, markStep, type DeadlinesState } from "@/lib/data/deadlines";
import { checklistSubtitle, checklistTitle, cycleLabel, shortDate, SOON_DAYS, windowProgress, type ChecklistView, type Deadline } from "@/lib/deadlines";
import { deadlinesHref } from "@/lib/features";
import { DateSheet } from "../deadlines/_deadlines/date-sheet";
import { useStepCaption } from "./step-caption";
import { StepSheet } from "./step-sheet";

type NextStepsProps = {
  state: DeadlinesState;
  // The card that leads Home instead of the hero: the setup card with no plan, or the plan's loading and error states
  lead: ReactNode;
  // Home's husky, standing behind the first block with its cut edge hidden (23 → Home hero)
  husky: ReactNode;
  showUpNext: boolean;
  showPath: boolean;
  toastBottom: string;
};

// Home under the greeting (23 → Board changes 1 and 2): the next deadline as the hero, then the application as a step
// path. "Keep going" opens the first unchecked step of the hero's deadline, or the deadline's own sheet when it has none.
export function NextSteps({ state, lead, husky, showUpNext, showPath, toastBottom }: NextStepsProps) {
  const [stepSheet, setStepSheet] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [dateSheet, setDateSheet] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  // `ready`: this check finished the checklist (16 → All steps done)
  const [toast, setToast] = useState<{ key: number; text: string; undoStep?: string } | null>(null);
  const prompts = useReminderPrompts(() => setToast({ key: Date.now(), text: "Reminders on" }));
  const ok = state.status === "ok" ? state : null;
  const c = showPath ? (ok?.checklist ?? null) : null;
  const caption = useStepCaption(c, ok?.term.term ?? null);
  const top = showUpNext ? ok?.view.upcoming[0] : undefined;
  const deadlinesLink = deadlinesHref();

  function check(stepId: string, done: boolean, fromPath: boolean) {
    if (!c) return;
    // The last step done finishes the checklist; the reward comes once per checklist per device
    const finishes = done && c.doneCount === c.steps.length - 1 && c.steps.some((s) => s.step.id === stepId && !s.done);
    const ready = finishes && claimChecklistReady(c.checklist.id);
    markStep(stepId, done);
    try {
      navigator.vibrate?.(10);
    } catch {}
    if (ready || (done && fromPath)) {
      // The toast follows the all-done title: "Your UC application is ready!" (18 → All-done wording)
      setToast((t) => ({ key: (t?.key ?? 0) + 1, text: ready ? `${checklistTitle(c)}!` : "Marked complete", undoStep: stepId }));
    } else setToast(null);
  }

  function keepGoing(d: Deadline) {
    const next = c && c.deadline.id === d.id ? c.steps.find((s) => !s.done) : undefined;
    if (next) setStepSheet({ open: true, id: next.step.id });
    else setDateSheet({ open: true, id: d.id });
  }

  // Without a plan the setup card leads, and the date steps down to a white card (15 → Up next)
  const hero = showUpNext && <UpNextBlock state={state} quiet={Boolean(lead) || !ok?.scope} onKeepGoing={keepGoing} />;
  const dateFor = (id: string | null) => (ok && id ? [...ok.view.upcoming, ...ok.view.finished].find((d) => d.id === id) ?? null : null);

  return (
    <>
      {showUpNext && deadlinesLink && ok && top && (
        <div className="mt-2 px-6">
          <TextLink href={deadlinesLink} transitionTypes={["push"]} size="label" className="-mx-2.5 px-2.5">
            All deadlines
          </TextLink>
        </div>
      )}

      <div className="relative mt-4 px-4">
        {/* Behind the first block, its bottom 18 hidden by it; 132 wide, 112 under 360 so the greeting fits beside it */}
        {(lead || (showUpNext && state.status !== "error")) && (
          <div aria-hidden className="absolute right-3 bottom-[calc(100%-18px)] w-[132px] max-[359px]:w-28">
            {husky}
          </div>
        )}
        <div className="relative">{lead ?? hero}</div>
      </div>
      {lead && hero && <div className="mt-4 px-4">{hero}</div>}

      {c && (
        <ApplicationPath
          c={c}
          caption={caption}
          onToggle={(id, done) => check(id, done, true)}
          onOpen={(id) => setStepSheet({ open: true, id })}
        />
      )}

      {c && (
        <StepSheet
          open={stepSheet.open}
          onClose={() => setStepSheet((s) => ({ ...s, open: false }))}
          checklist={c}
          caption={caption}
          stepId={stepSheet.id}
          onToggle={(id, done) => check(id, done, false)}
        />
      )}
      {ok && (
        <DateSheet
          open={dateSheet.open && dateFor(dateSheet.id) !== null}
          deadline={dateFor(dateSheet.id)}
          mark={dateSheet.id ? ok.marks[dateSheet.id] : undefined}
          scope={ok.scope}
          focusReminders={false}
          reminders={{
            defaults: prompts.reminders.days,
            denied: prompts.reminders.permission === "denied",
            onChoose: (days) => {
              const id = dateSheet.id;
              if (!id) return;
              prompts.choose(id, ok.marks[id], days, {
                close: () => setDateSheet((s) => ({ ...s, open: false })),
                reopen: () => setDateSheet({ open: true, id }),
              });
            },
          }}
          onClose={() => setDateSheet((s) => ({ ...s, open: false }))}
          onMarkDone={(done) => dateSheet.id && markDeadline(dateSheet.id, done)}
        />
      )}
      {prompts.dialogs}

      {toast && (
        <Toast
          key={toast.key}
          message={toast.text}
          overSheet={stepSheet.open || dateSheet.open}
          action={
            toast.undoStep
              ? {
                  label: "Undo",
                  onClick: () => {
                    markStep(toast.undoStep!, false);
                    setToast(null);
                  },
                }
              : undefined
          }
          bottom={toastBottom}
          onDone={() => setToast(null)}
        />
      )}
    </>
  );
}

// The next deadline (23 → Home hero): "Up next", the day count with what's due, the filing window, and Keep going.
// Blue, or coral at 14 days or less. Passive: Keep going is the control. Quiet: the same on a white card.
function UpNextBlock({ state, quiet, onKeepGoing }: { state: DeadlinesState; quiet: boolean; onKeepGoing: (d: Deadline) => void }) {
  if (state.status === "error") return null;
  if (state.status === "loading") {
    return (
      <AfterWait>
        <div aria-hidden className="h-[228px] rounded-hero bg-surface-pressed" />
      </AfterWait>
    );
  }
  const d = state.view.upcoming[0];
  if (!d) {
    return (
      <p className="rounded-lg border-2 border-border bg-surface p-4 text-slate-600 type-body">
        No deadlines coming up for {cycleLabel(state.view.cycle).toLowerCase()}. We add the next cycle when schools publish their dates.
      </p>
    );
  }

  const soon = d.daysLeft <= SOON_DAYS;
  const progress = windowProgress(d, state.now);
  const body = (
    <div className="flex flex-col items-start">
      <p className={quiet ? "text-slate-600 type-label" : "type-label"}>Up next</p>
      <div className="mt-3 flex items-end gap-2.5">
        {d.daysLeft > 0 && <p className={quiet ? "text-navy-900 tabular-nums type-title-1" : "type-hero-number"}>{d.daysLeft}</p>}
        <div className="min-w-0 pb-0.5">
          <p className={quiet ? "text-navy-900 type-headline" : "type-headline"}>{d.daysLeft <= 0 ? "Due today" : d.daysLeft === 1 ? "day left" : "days left"}</p>
          <p className={quiet ? "text-slate-600 type-label" : "type-label"}>
            {d.title}, due {shortDate(d.due_at)}
          </p>
        </div>
      </div>
      {d.opens_at && (
        <WindowBar
          className="mt-3 w-full"
          progress={progress}
          soon={soon}
          onFill={!quiet}
          start={`${d.notOpenYet ? "Opens" : "Opened"} ${shortDate(d.opens_at)}`}
          end={shortDate(d.due_at)}
        />
      )}
      {quiet ? (
        <SecondaryButton hug onClick={() => onKeepGoing(d)} className="mt-3">
          Keep going
        </SecondaryButton>
      ) : (
        <PrimaryButton onHero onClick={() => onKeepGoing(d)} className="mt-3">
          Keep going
        </PrimaryButton>
      )}
    </div>
  );
  if (quiet) return <div className="rounded-lg border-2 border-border bg-surface p-4">{body}</div>;
  return <Hero tone={soon ? "coral" : "blue"}>{body}</Hero>;
}

// The application checklist as the step path (00 → Step path): the title and count, what's left, then every step
function ApplicationPath({
  c,
  caption,
  onToggle,
  onOpen,
}: {
  c: ChecklistView;
  caption: (entry: ChecklistView["steps"][number]) => string | null;
  onToggle: (id: string, done: boolean) => void;
  onOpen: (id: string) => void;
}) {
  const total = c.steps.length;
  // One step left, and this checklist hasn't been finished on this device yet: checking it gets the bigger burst
  const finale = c.doneCount === total - 1 && !checklistCelebrated(c.checklist.id);
  return (
    <section aria-labelledby="path-title" className="mt-8">
      <div className="flex items-baseline justify-between gap-3 px-6">
        <h2 id="path-title" className="line-clamp-2 min-w-0 text-navy-900 type-title-2">
          {checklistTitle(c)}
        </h2>
        <p className="shrink-0 text-slate-600 tabular-nums type-label">
          {c.doneCount} of {total} done
        </p>
      </div>
      <p className="mt-1 px-6 text-slate-600 type-body">{checklistSubtitle(c)}</p>
      <div className="mt-4 px-4">
        <StepPath
          steps={c.steps.map((entry) => ({ id: entry.step.id, title: entry.step.title, done: entry.done, caption: caption(entry) }))}
          finale={finale}
          onToggle={onToggle}
          onOpen={onOpen}
        />
      </div>
    </section>
  );
}
