"use client";

import { BellRingingIcon, XIcon } from "@phosphor-icons/react/ssr";
import { AskCard } from "@/components/ui/ask-card";
import { TintedButton } from "@/components/ui/tinted-button";

// Shown once on the Deadlines screen, iPhone app only, until reminders are turned on or it's dismissed
// (14 → Reminders card). Dismissing hides it for good; the Reminders group in Settings stays.
// Tier 3, the ask (15 → Reminders ask): tinted fill and border, no shadow, the bell inline at the left.
export function RemindersCard({ onTurnOn, onDismiss }: { onTurnOn: () => void; onDismiss: () => void }) {
  return (
    <AskCard labelledBy="reminders-card-title" icon={<BellRingingIcon weight="fill" size={24} aria-hidden />}>
      <h2 id="reminders-card-title" className="pr-8 text-navy-900 type-headline">
        Get a heads-up before each deadline
      </h2>
      <p className="mt-1 text-slate-600 type-body">We&apos;ll remind you a week before and the day before.</p>
      <TintedButton onClick={onTurnOn} className="mt-3">
        Turn on reminders
      </TintedButton>
      <button
        type="button"
        aria-label="Not now"
        onClick={onDismiss}
        className="absolute right-1 top-1 flex size-11 items-center justify-center rounded-full text-slate-600 pressed:bg-blue-100"
      >
        <XIcon weight="bold" size={20} aria-hidden />
      </button>
    </AskCard>
  );
}
