import { accountStore } from "@/lib/account-store";
import type { Deadline } from "@/lib/deadlines";
import { pacificToday, REMIND_DAYS } from "@/lib/opportunities";
import type { ReminderItem } from "./schedule";

// Remind me on an opportunity (22 → 6): reminders 7 days and 1 day before its deadline, scheduled with the deadline
// reminders (lib/reminders/sync.ts). The list lives on this phone, tagged with the account, and is cleared at sign-out.
export const OPPORTUNITY_REMINDERS_KEY = "stackd.opportunityReminders";

// A reminder's deadlineId; tapping the notification opens that opportunity instead of the Deadlines screen
export const OPPORTUNITY_PREFIX = "opportunity:";

export type OpportunityReminder = { slug: string; title: string; deadline: string };

const store = accountStore<OpportunityReminder[]>(OPPORTUNITY_REMINDERS_KEY, []);

export const useOpportunityReminders = store.use;
export const readOpportunityReminders = store.get;
export const subscribeOpportunityReminders = store.subscribe;

export function setOpportunityReminder(reminder: OpportunityReminder, on: boolean) {
  store.set((list) => [...list.filter((r) => r.slug !== reminder.slug), ...(on ? [reminder] : [])]);
}

// 23:59:59 Pacific on the day, the way a deadline with no stated time is stored (14)
function endOfPacificDay(day: string) {
  const winter = new Date(`${day}T23:59:59-08:00`);
  return pacificToday(winter) === day ? winter.toISOString() : new Date(`${day}T23:59:59-07:00`).toISOString();
}

// The chosen opportunities as dates for planReminders, past ones left out
export function opportunityReminderItems(list: OpportunityReminder[], now: Date): ReminderItem[] {
  const today = pacificToday(now);
  return list
    .filter((r) => r.deadline >= today)
    .map((r) => {
      const deadline: Deadline = {
        id: `${OPPORTUNITY_PREFIX}${r.slug}`,
        cycle: "",
        audience: "",
        kind: "opportunity",
        title: r.title,
        summary: "",
        opens_at: null,
        due_at: endOfPacificDay(r.deadline),
        due_has_time: false,
        varies_by_campus: false,
        source_name: "",
        source_url: "",
        retrieved_at: null,
        verified_at: null,
        verification_status: "verified",
        doneAt: null,
        daysLeft: 0,
        state: "open",
        windowOpen: true,
        notOpenYet: false,
      };
      return { deadline, days: REMIND_DAYS };
    });
}
