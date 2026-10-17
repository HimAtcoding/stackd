"use client";

import { useEffect, useRef, type RefObject } from "react";
import { ArrowSquareOutIcon, CheckCircleIcon, CheckIcon } from "@phosphor-icons/react/ssr";
import { OpenSettingsLink } from "@/components/deadlines/open-settings-link";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { ChoiceList, ChoiceRow } from "@/components/ui/choice-row";
import { TintedButton } from "@/components/ui/tinted-button";
import { isNativeApp } from "@/lib/capacitor";
import { cn } from "@/lib/cn";
import { REMINDER_DAYS, remindersFor, type DeadlineMark } from "@/lib/data/deadlines";
import { countdownLine, recordSource, sheetForLine, whenLines, type Deadline, type Scope } from "@/lib/deadlines";
import { FEATURES } from "@/lib/features";
import { REMINDER_LABELS, toggleDay } from "@/lib/reminders";

// The student's reminder settings, as the sheet needs them
type ReminderProps = {
  // Settings' "Remind me", for a date the student hasn't changed
  defaults: number[];
  // iOS permission was denied: the choices give way to the "Open Settings" line
  denied: boolean;
  // A choice was tapped; the screen saves it and runs the permission flow if iOS hasn't asked yet
  onChoose: (days: number[]) => void;
};

type DateSheetProps = {
  open: boolean;
  // Kept while the sheet slides away, so it doesn't empty as it closes
  deadline: Deadline | null;
  mark: DeadlineMark | undefined;
  scope: Scope;
  // Opened from "Remind me": the Reminders block scrolls into view
  focusReminders: boolean;
  reminders: ReminderProps;
  onClose: () => void;
  onMarkDone: (done: boolean) => void;
};

// One date in full: when, what it is, who it's for, reminders, done, and its official source (14 → Date sheet)
export function DateSheet({ open, deadline: d, mark, scope, focusReminders, reminders: reminderProps, onClose, onMarkDone }: DateSheetProps) {
  const reminders = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open && focusReminders) reminders.current?.scrollIntoView({ block: "nearest" });
  }, [open, focusReminders]);

  return (
    <BottomSheet open={open && d !== null} onClose={onClose} labelledBy="date-sheet-title">
      {d && <Content d={d} mark={mark} scope={scope} remindersRef={reminders} reminders={reminderProps} onMarkDone={onMarkDone} />}
    </BottomSheet>
  );
}

function Content({
  d,
  mark,
  scope,
  remindersRef,
  reminders,
  onMarkDone,
}: {
  d: Deadline;
  mark: DeadlineMark | undefined;
  scope: Scope;
  remindersRef: RefObject<HTMLDivElement | null>;
  reminders: ReminderProps;
  onMarkDone: (done: boolean) => void;
}) {
  const soon = d.state === "soon";
  const forLine = sheetForLine(d, scope);
  const chosen = remindersFor(mark, reminders.defaults);

  return (
    <div className="-mx-6 -mt-6 max-h-[calc(100dvh-var(--safe-top)-72px)] overflow-y-auto px-6 pt-6">
      <h2 id="date-sheet-title" tabIndex={-1} className="text-navy-900 type-title-2 focus:outline-none">
        {d.title}
      </h2>
      <p className={cn("mt-2 type-headline", soon ? "text-coral-700" : "text-navy-900")}>{countdownLine(d)}</p>
      <div className="mt-4 text-slate-700 type-body">
        {whenLines(d).map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
      <p className="mt-4 text-navy-900 type-body">{d.summary}</p>
      {forLine && <p className="mt-2 text-slate-700 type-body">{forLine}</p>}

      {FEATURES.reminders && (
        <div ref={remindersRef} className="mt-6 scroll-mt-6">
          <h3 id="reminders-title" className="text-navy-900 type-headline">
            Remind me
          </h3>
          {isNativeApp() && reminders.denied ? (
            <p className="mt-1 text-slate-600 type-body">
              Reminders are off for Stackd in your iPhone settings. <OpenSettingsLink />
            </p>
          ) : isNativeApp() ? (
            <ChoiceList role="group" aria-label="Remind me" className="mt-3">
              {REMINDER_DAYS.map((days) => (
                <ChoiceRow
                  key={days}
                  role="checkbox"
                  checked={chosen.includes(days)}
                  name={REMINDER_LABELS[days]}
                  onSelect={() => reminders.onChoose(toggleDay(chosen, days))}
                />
              ))}
            </ChoiceList>
          ) : (
            <p className="mt-1 text-slate-600 type-body">Reminders work in the Stackd iPhone app.</p>
          )}
        </div>
      )}

      <div className="mt-6">
        {d.state === "done" ? (
          <div className="flex min-h-12 items-center gap-2">
            <CheckCircleIcon weight="fill" size={20} aria-hidden className="text-green-600" />
            <p className="text-navy-900 type-headline">Marked done</p>
            <button
              type="button"
              onClick={() => onMarkDone(false)}
              className="-my-3 ml-2 py-3 text-blue-600 type-link pressed:underline focus-ring:underline"
            >
              Undo
            </button>
          </div>
        ) : (
          <TintedButton icon={<CheckIcon weight="bold" size={20} aria-hidden />} onClick={() => onMarkDone(true)}>
            Mark done
          </TintedButton>
        )}
      </div>

      <p className="mt-4 text-slate-600 type-caption">{recordSource(d)}</p>
      <a
        href={d.source_url}
        target="_blank"
        rel="noopener"
        className="-my-[13px] inline-flex items-center gap-1 py-[13px] text-blue-600 type-label pressed:underline focus-ring:underline"
      >
        Open official page
        <ArrowSquareOutIcon weight="bold" size={16} aria-hidden />
      </a>
    </div>
  );
}
