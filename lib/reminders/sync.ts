import type { PluginListenerHandle } from "@capacitor/core";
import { currentScope, loadDeadlines, readDeadlines, subscribeDeadlines } from "@/lib/data/deadlines";
import { readPlanState, refreshPlan, subscribePlan } from "@/lib/data/plan";
import { buildView } from "@/lib/deadlines";
import { deadlinesHref } from "@/lib/features";
import { DEMO_MODE } from "@/lib/flags";
import { readSessionUser } from "@/lib/profile";
import { readPermission, readReminderSettings, refreshPermission, remindersSupported, subscribePermission, subscribeReminderSettings } from "./index";
import { announceReminderTap } from "./choice";
import { withNotifications, withNotificationsExclusive } from "./native";
import { cancelAll, planReminders, reminderItems, rescheduleIfCurrent } from "./schedule";

// Keeps the phone's scheduled reminders in step with the student's dates (14 → What gets scheduled): rescheduled
// when the app opens or comes back, and whenever the plan, the term, a done mark, a date's reminder days, the
// default, the switch, iOS's permission or the dates themselves change. Started by the session gate.

const SETTLE_MS = 300;

// The whole set, worked out again from scratch. Waits while the dates or the plan are still loading, so a slow
// network never wipes reminders that are already scheduled. `stillCurrent` is checked again on the phone's lock.
async function apply(stillCurrent: () => boolean) {
  const settings = readReminderSettings();
  if (!settings.on || readPermission() !== "granted") return withNotificationsExclusive((api) => cancelAll(api));
  const { records, marks, term } = readDeadlines();
  const scope = currentScope();
  if (records.status !== "ok" || scope === undefined) return;
  const now = new Date();
  const view = buildView(records.data.deadlines, (id) => marks[id]?.done_at ?? null, scope, term.term, now);
  const planned = planReminders(reminderItems(view.upcoming, marks, settings.days), now);
  await withNotificationsExclusive((api) => rescheduleIfCurrent(api, planned, stillCurrent));
}

// `open` navigates inside the app; tapping a reminder opens that date's sheet on the Deadlines screen
export function startReminders(open: (href: string) => void): () => void {
  if (!remindersSupported()) return () => {};
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let queue = Promise.resolve();
  // The account these reminders belong to; once it signs out, nothing more is scheduled for it
  const userId = readSessionUser()?.id ?? null;
  const stillCurrent = () => !stopped && (readSessionUser()?.id ?? null) === userId;

  // Changes often come in bursts (a mark and its sync); one reschedule after they settle, never two at once
  const reschedule = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      queue = queue.then(() => (stillCurrent() ? apply(stillCurrent) : undefined)).catch(() => {});
    }, SETTLE_MS);
  };

  const onVisible = () => {
    if (document.visibilityState !== "visible") return;
    refreshPermission();
    loadDeadlines(true);
    reschedule();
  };

  const stops = [subscribeDeadlines(reschedule), subscribePlan(reschedule), subscribeReminderSettings(reschedule), subscribePermission(reschedule)];
  document.addEventListener("visibilitychange", onVisible);

  let tap: PluginListenerHandle | null = null;
  withNotifications((api) =>
    api.addListener("localNotificationActionPerformed", ({ notification }) => {
      const id = (notification.extra as { deadlineId?: string } | undefined)?.deadlineId;
      const href = deadlinesHref(id ? `?id=${encodeURIComponent(id)}` : "");
      if (!href) return;
      // An open Deadlines screen opens the sheet itself; any other screen navigates there
      if (id) announceReminderTap(id);
      open(href);
    }),
  )
    .then((handle) => {
      if (stopped) handle.remove();
      else tap = handle;
    })
    .catch(() => {});

  refreshPermission();
  loadDeadlines();
  if (!DEMO_MODE && readPlanState().status !== "ok") refreshPlan();
  reschedule();

  return () => {
    stopped = true;
    clearTimeout(timer);
    stops.forEach((stop) => stop());
    document.removeEventListener("visibilitychange", onVisible);
    tap?.remove();
  };
}
