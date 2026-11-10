"use client";

import { useState } from "react";
import { remindersFor, setReminders, type DeadlineMark } from "@/lib/data/deadlines";
import { turnOnReminders, useReminders } from "@/lib/reminders";
import { afterReminderChoice } from "@/lib/reminders/choice";
import { RemindersAsk } from "./reminders-ask";
import { TurnOnConfirm } from "./turn-on-confirm";

// The reminder permission flow (14 → Permission flow), shared by every screen that opens a date's sheet: the soft ask
// while iOS hasn't asked, and "Turn on reminders?" when they're off in Settings. `onTurnedOn` shows the screen's toast.
export function useReminderPrompts(onTurnedOn: () => void) {
  const reminders = useReminders();
  // The soft ask is open; `then` runs once the student has answered it (allowed or not)
  const [asking, setAsking] = useState<{ then?: (allowed: boolean) => void } | null>(null);
  // "Turn on reminders?" is open; `then` brings the date's sheet back
  const [confirming, setConfirming] = useState<{ then: () => void } | null>(null);

  // iOS's own prompt. Allowed: reminders on for every tracked date.
  async function allow() {
    const then = asking?.then;
    setAsking(null);
    const allowed = (await turnOnReminders()) === "granted";
    if (allowed) onTurnedOn();
    then?.(allowed);
  }

  function notNow() {
    const then = asking?.then;
    setAsking(null);
    then?.(false);
  }

  async function confirm() {
    const then = confirming?.then;
    setConfirming(null);
    if ((await turnOnReminders()) === "granted") onTurnedOn();
    then?.();
  }

  function decline() {
    const then = confirming?.then;
    setConfirming(null);
    then?.();
  }

  // A reminder choice saves at once. While iOS hasn't asked, the soft ask comes first; when reminders are off in
  // Settings, adding a day asks before turning them on for every date. Either way the sheet comes back after.
  function choose(id: string, mark: DeadlineMark | undefined, days: number[], sheet: { close: () => void; reopen: () => void }) {
    const before = remindersFor(mark, reminders.days);
    setReminders(id, days);
    const next = afterReminderChoice({ permission: reminders.permission, on: reminders.on, before, after: days });
    if (next === "save") return;
    sheet.close();
    if (next === "soft-ask") setAsking({ then: sheet.reopen });
    else setConfirming({ then: sheet.reopen });
  }

  const dialogs = reminders.supported && (
    <>
      <RemindersAsk open={asking !== null} onAllow={allow} onClose={notNow} />
      <TurnOnConfirm open={confirming !== null} onTurnOn={confirm} onClose={decline} />
    </>
  );

  return { reminders, ask: (then?: (allowed: boolean) => void) => setAsking({ then }), choose, dialogs };
}
