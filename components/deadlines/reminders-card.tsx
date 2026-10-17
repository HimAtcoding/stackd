"use client";

import { BellRingingIcon, XIcon } from "@phosphor-icons/react/ssr";
import { TintedButton } from "@/components/ui/tinted-button";

// Shown once on the Deadlines screen, iPhone app only, until reminders are turned on or it's dismissed
// (14 → Reminders card). Dismissing hides it for good; the Reminders group in Settings stays.
export function RemindersCard({ onTurnOn, onDismiss }: { onTurnOn: () => void; onDismiss: () => void }) {
  return (
    <section aria-labelledby="reminders-card-title" className="relative rounded-lg bg-surface p-4 shadow-card">
      <div className="flex gap-4">
        <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-sm bg-tint-sky">
          <BellRingingIcon weight="fill" size={24} className="text-blue-600" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="reminders-card-title" className="pr-8 text-navy-900 type-headline">
            Get a heads-up before each deadline
          </h2>
          <p className="mt-1 text-slate-600 type-body">We&apos;ll remind you a week before and the day before.</p>
          <TintedButton onClick={onTurnOn} className="mt-3">
            Turn on reminders
          </TintedButton>
        </div>
      </div>
      <button
        type="button"
        aria-label="Not now"
        onClick={onDismiss}
        className="absolute right-1 top-1 flex size-11 items-center justify-center rounded-full text-slate-600 pressed:bg-surface-pressed"
      >
        <XIcon weight="bold" size={20} aria-hidden />
      </button>
    </section>
  );
}
