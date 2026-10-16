"use client";

import { motion } from "motion/react";
import { useState, ViewTransition } from "react";
import { BellIcon, BellRingingIcon, CheckIcon } from "@phosphor-icons/react/ssr";
import { CountdownBlock } from "@/components/deadlines/countdown-block";
import { TintedButton } from "@/components/ui/tinted-button";
import { rowLabel, type Deadline, type Scope } from "@/lib/deadlines";
import { FEATURES } from "@/lib/features";

type NextUpCardProps = {
  deadline: Deadline;
  now: Date;
  scope: Scope;
  // Reminders are on and this date has at least one: the button reads "Reminders on"
  remindersOn: boolean;
  onRemind: () => void;
  onMarkDone: () => void;
};

// Home's top layer at the same size, as a plain card, with Remind me and Mark done (14 → Next-up card).
// After Mark done it hands over to the next date: the content fades in and the number counts to its new value.
export function NextUpCard({ deadline, now, scope, remindersOn, onRemind, onMarkDone }: NextUpCardProps) {
  // The date shown before this one, so the number counts from its value
  const [shown, setShown] = useState<{ id: string; days: number; from?: number }>({ id: deadline.id, days: deadline.daysLeft });
  if (shown.id !== deadline.id) setShown({ id: deadline.id, days: deadline.daysLeft, from: shown.days });
  const countFrom = shown.id === deadline.id ? shown.from : shown.days;

  return (
    <section aria-label={`Next up: ${rowLabel(deadline)}`} className="rounded-lg bg-surface p-4 shadow-card">
      <ViewTransition name="next-deadline" share="next-deadline" enter="none" exit="none" update="none">
        <div>
          <motion.div key={deadline.id} initial={countFrom === undefined ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
            <CountdownBlock deadline={deadline} now={now} scope={scope} countFrom={countFrom} />
          </motion.div>
        </div>
      </ViewTransition>
      <div className="mt-4 flex gap-3">
        {FEATURES.reminders && (
          <TintedButton
            icon={remindersOn ? <BellRingingIcon weight="fill" size={20} aria-hidden /> : <BellIcon weight="bold" size={20} aria-hidden />}
            onClick={onRemind}
            className="flex-1"
          >
            {remindersOn ? "Reminders on" : "Remind me"}
          </TintedButton>
        )}
        <TintedButton
          icon={<CheckIcon weight="bold" size={20} aria-hidden />}
          onClick={onMarkDone}
          aria-label={`Mark ${deadline.title} done`}
          className="flex-1"
        >
          Mark done
        </TintedButton>
      </div>
    </section>
  );
}
