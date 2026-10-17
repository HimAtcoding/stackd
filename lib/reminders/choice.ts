// What happens after a reminder choice in a date sheet. No React and no Capacitor, so it can be tested.

export type ChoiceNext =
  // iOS hasn't asked yet: the soft ask comes first (14 → Permission flow)
  | "soft-ask"
  // Reminders are off in Settings and a day was added: ask before turning them on for every date
  | "confirm-turn-on"
  // Saved, nothing more to do
  | "save";

type ChoiceContext = {
  permission: string;
  // Settings' Deadline reminders switch
  on: boolean;
  before: number[];
  after: number[];
};

export function afterReminderChoice({ permission, on, before, after }: ChoiceContext): ChoiceNext {
  if (permission === "prompt") return "soft-ask";
  const added = after.some((day) => !before.includes(day));
  if (permission === "granted" && !on && added) return "confirm-turn-on";
  return "save";
}

// A tapped reminder, told to a Deadlines screen that's already open. Its address may not change (the same date
// tapped twice), so ?id= alone can't reach it.
const TAP_EVENT = "stackd:reminder-tap";

export function announceReminderTap(deadlineId: string) {
  window.dispatchEvent(new CustomEvent(TAP_EVENT, { detail: deadlineId }));
}

export function onReminderTap(open: (deadlineId: string) => void) {
  const listener = (e: Event) => {
    const id = (e as CustomEvent<unknown>).detail;
    if (typeof id === "string" && id) open(id);
  };
  window.addEventListener(TAP_EVENT, listener);
  return () => window.removeEventListener(TAP_EVENT, listener);
}
