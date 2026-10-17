import { useEffect, useSyncExternalStore } from "react";
import { accountStore } from "@/lib/account-store";
import { isNativeApp } from "@/lib/capacitor";
import { DEFAULT_REMINDERS, REMINDER_DAYS } from "@/lib/data/deadlines";
import { FEATURES } from "@/lib/features";
import { subscribeNoop } from "@/lib/session";
import { checkPermission, requestPermission, type Permission } from "./native";

// Reminder settings (14 → Reminders, Settings additions). They live on this phone, since only this phone schedules
// its reminders, tagged with the account and cleared at sign-out like the other per-account keys.
export const REMINDERS_KEY = "stackd.reminders";

// on: Settings' Deadline reminders switch. everOn: reminders have been on at least once, so the Deadlines screen's
// card stops showing. days: Settings' "Remind me" default. dismissed: the student closed the card.
export type ReminderSettings = { on: boolean; everOn: boolean; days: number[]; dismissed: boolean };

const DEFAULTS: ReminderSettings = { on: false, everOn: false, days: DEFAULT_REMINDERS, dismissed: false };
const settings = accountStore(REMINDERS_KEY, DEFAULTS);

export const REMINDER_LABELS: Record<(typeof REMINDER_DAYS)[number], string> = {
  7: "1 week before",
  3: "3 days before",
  1: "1 day before",
  0: "The morning it's due",
};

export { remindersSummary } from "./schedule";

// Choice rows toggle one day; the list stays in REMINDER_DAYS order (a week first)
export const toggleDay = (days: number[], day: number) =>
  days.includes(day) ? days.filter((d) => d !== day) : REMINDER_DAYS.filter((d) => d === day || days.includes(d));

// Reminders exist only in the iPhone app, behind their flag
export const remindersSupported = () => FEATURES.reminders && isNativeApp();

// iOS's notification permission for Stackd, read again when the app comes back (it can change in iPhone settings)
let permission: Permission | "checking" = "checking";
const permissionListeners = new Set<() => void>();

function setPermission(next: Permission) {
  if (next === permission) return;
  permission = next;
  permissionListeners.forEach((l) => l());
}

export function subscribePermission(onChange: () => void) {
  permissionListeners.add(onChange);
  return () => {
    permissionListeners.delete(onChange);
  };
}

export const readPermission = () => permission;

export async function refreshPermission() {
  if (remindersSupported()) setPermission(await checkPermission());
}

export const readReminderSettings = settings.get;
export const subscribeReminderSettings = settings.subscribe;

export type RemindersState = ReminderSettings & {
  // False on the web and while the flag is off; false during prerendering, so the page hydrates the same everywhere
  supported: boolean;
  permission: Permission | "checking";
  // Reminders are being scheduled: the switch is on and iOS allows them
  active: boolean;
};

export function useReminders(): RemindersState {
  const supported = useSyncExternalStore(subscribeNoop, remindersSupported, () => false);
  const current = settings.use();
  const perm = useSyncExternalStore(subscribePermission, readPermission, () => "checking" as const);
  useEffect(() => {
    refreshPermission();
  }, []);
  return { ...current, supported, permission: perm, active: supported && current.on && perm === "granted" };
}

// Asks iOS (its prompt appears only the first time). Allowed: reminders go on for every tracked date.
export async function turnOnReminders(): Promise<Permission> {
  const result = await requestPermission();
  setPermission(result);
  if (result === "granted") settings.set((prev) => ({ ...prev, on: true, everOn: true }));
  return result;
}

// Off cancels every scheduled reminder (lib/reminders/sync.ts reschedules to nothing)
export function turnOffReminders() {
  settings.set((prev) => ({ ...prev, on: false }));
}

export function setDefaultReminders(days: number[]) {
  settings.set((prev) => ({ ...prev, days }));
}

export function dismissRemindersCard() {
  settings.set((prev) => ({ ...prev, dismissed: true }));
}
