"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BackButton } from "@/components/back-button";
import { OpenSettingsLink } from "@/components/deadlines/open-settings-link";
import { FlashToast } from "@/components/flash-toast";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { ChoiceList, ChoiceRow } from "@/components/ui/choice-row";
import { DestructiveButton } from "@/components/ui/destructive-button";
import { Expand } from "@/components/ui/expand";
import { InlineError } from "@/components/ui/inline-error";
import { Loading } from "@/components/ui/loading";
import { SettingsGroup, SettingsRow } from "@/components/ui/settings-row";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { TextLink } from "@/components/ui/text-link";
import { TintedButton } from "@/components/ui/tinted-button";
import { Toast } from "@/components/ui/toast";
import { UnofficialFooter } from "@/components/ui/unofficial-footer";
import { DEVELOPER_CREDIT } from "@/lib/about";
import { auth } from "@/lib/auth";
import { setCarriedEmail } from "@/lib/auth/email-store";
import { inlineErrorCopy } from "@/lib/auth/messages";
import { REMINDER_DAYS, saveTerm, useTerm, type TermChoice } from "@/lib/data/deadlines";
import { retryPlan, usePlan, type Plan } from "@/lib/data/plan";
import { cycleLabel } from "@/lib/deadlines";
import { FEATURES } from "@/lib/features";
import { DEMO_MODE } from "@/lib/flags";
import { setFlash } from "@/lib/flash";
import { majorWithDegree } from "@/lib/format";
import { onboardingUrl } from "@/lib/onboarding";
import { readSessionUser } from "@/lib/profile";
import { REMINDER_LABELS, remindersSummary, setDefaultReminders, toggleDay, turnOffReminders, turnOnReminders, useReminders } from "@/lib/reminders";
import { markWelcomeSeen } from "@/lib/session";
import { TermSheet } from "../../deadlines/_deadlines/term-question";

const TOAST_BOTTOM = "calc(var(--safe-bottom) + 12px)";
const SHEET_TITLE = "delete-account-title";

// What the Schools and Major rows show for a saved plan (11 → Your plan)
function schoolsValue(plan: Plan) {
  return plan.targets.length === 1 ? plan.targets[0].name : `${plan.targets.length} schools`;
}

// Any school still waiting for a major comes first: "Pick a major". Otherwise the majors picked, by name or count;
// "Not listed yet" when that's the answer for every school.
function majorValue(plan: Plan): { text: string; missing?: boolean } {
  if (plan.targets.some((t) => !t.majorName && !t.majorNotListed)) return { text: "Pick a major", missing: true };
  const names = [...new Set(plan.targets.flatMap((t) => (t.majorName ? [majorWithDegree(t.majorName, t.degreeType)] : [])))];
  if (names.length === 0) return { text: "Not listed yet" };
  return { text: names.length === 1 ? names[0] : `${names.length} majors` };
}

// The Transfer term row (14 → Settings additions): the term, "Not sure yet", or a prompt while it's never been answered
function termValue({ asked, term }: TermChoice): { text: string; missing?: boolean } {
  if (term) return { text: cycleLabel(term) };
  return asked ? { text: "Not sure yet" } : { text: "Pick a term", missing: true };
}

// 11: the student's plan answers, their account, sign out, and deleting the account.
export function SettingsScreen() {
  const router = useRouter();
  const planState = usePlan();
  // Read once: the account can't change while this screen is open
  const [user] = useState(readSessionUser);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ key: number; text: string } | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteFailed, setDeleteFailed] = useState(false);
  const term = useTerm();
  const [termSheet, setTermSheet] = useState(false);
  const reminders = useReminders();
  const [remindSheet, setRemindSheet] = useState(false);

  // Settings needs a real account; demo mode has none
  useEffect(() => {
    if (DEMO_MODE) router.replace("/");
  }, [router]);
  if (DEMO_MODE) return null;

  async function changePassword() {
    if (sending || !user?.email) return;
    setSending(true);
    const result = await auth.sendPasswordReset(user.email);
    if (result.ok) {
      setCarriedEmail(user.email);
      return router.push("/enter-code/?for=reset");
    }
    setSending(false);
    const { title, body } = inlineErrorCopy(result.error);
    setToast({ key: Date.now(), text: `${title}. ${body}` });
  }

  // No confirmation: the plan and progress are in the account, so nothing is lost
  async function signOut() {
    if (leaving) return;
    setLeaving(true);
    setFlash("Signed out");
    // A student with an account has been here before, so they land on Sign in, not Welcome
    markWelcomeSeen();
    await auth.signOut();
    router.replace("/sign-in", { transitionTypes: ["crossfade"] });
  }

  function chooseTerm(choice: string | null) {
    saveTerm(choice);
    setTermSheet(false);
    setToast({ key: Date.now(), text: "Transfer term saved" });
  }

  // The student asked for reminders right here, so iOS's prompt comes straight away, with no soft ask first.
  // Off cancels every scheduled reminder.
  async function toggleReminders(on: boolean) {
    if (!on) return turnOffReminders();
    if ((await turnOnReminders()) === "granted") setToast({ key: Date.now(), text: "Reminders on" });
  }

  async function deleteAccount() {
    if (deleting) return;
    setDeleteFailed(false);
    setDeleting(true);
    const result = await auth.deleteAccount();
    if (!result.ok) {
      setDeleting(false);
      setDeleteFailed(true);
      return;
    }
    // Everything on the device is gone, "Welcome seen" included, so it's a first launch again
    setFlash("Account deleted");
    router.replace("/welcome", { transitionTypes: ["crossfade"] });
  }

  const plan = planState.status === "ok" ? planState.plan : null;
  const major = plan && plan.targets.length > 0 ? majorValue(plan) : null;
  const transferTerm = termValue(term);
  const remindersDenied = reminders.permission === "denied";

  return (
    <main
      className="mx-auto min-h-dvh max-w-[480px] bg-sky-50"
      style={{ paddingTop: "calc(var(--safe-top) + 8px)", paddingBottom: "calc(var(--safe-bottom) + 24px)" }}
    >
      <div className="px-4">
        <BackButton fallback="/" slideBack />
      </div>
      <h1 className="mt-6 px-6 text-navy-900 type-title-1">Settings</h1>

      <h2 className="mt-6 px-6 text-navy-900 type-title-3">Your plan</h2>
      {plan ? (
        <SettingsGroup className="mx-4 mt-3">
          {major ? (
            <>
              <SettingsRow label="College" value={plan.home?.name ?? "Not listed"} href={onboardingUrl("college", { edit: true })} />
              <SettingsRow label="Schools" value={schoolsValue(plan)} href={onboardingUrl("schools", { edit: true })} />
              <SettingsRow label="Major" value={major.text} valueTone={major.missing ? "action" : undefined} href={onboardingUrl("major", { edit: true })} />
            </>
          ) : (
            <SettingsRow label="Set up your plan" labelTone="action" href={onboardingUrl("college", { from: "settings" })} />
          )}
          {FEATURES.deadlines && (
            <SettingsRow
              label="Transfer term"
              value={transferTerm.text}
              valueTone={transferTerm.missing ? "action" : undefined}
              onClick={() => setTermSheet(true)}
              chevron
            />
          )}
        </SettingsGroup>
      ) : planState.status === "error" ? (
        <div className="mx-4 mt-3">
          <InlineError
            title="Couldn't load your plan"
            body="Check your connection, then try again."
            action={<TintedButton onClick={retryPlan}>Try again</TintedButton>}
          />
        </div>
      ) : (
        <div className="mt-3">
          <Loading label="Loading your plan" />
        </div>
      )}

      {/* 14 → Settings additions: iPhone app only */}
      {reminders.supported && (
        <>
          <h2 className="mt-6 px-6 text-navy-900 type-title-3">Reminders</h2>
          <SettingsGroup className="mx-4 mt-3">
            <div className="flex h-14 items-center px-4">
              <span id="deadline-reminders-label" className="text-navy-900 type-row-title">
                Deadline reminders
              </span>
              <span className="ml-auto flex">
                <Switch
                  checked={reminders.on && !remindersDenied}
                  disabled={remindersDenied}
                  aria-labelledby="deadline-reminders-label"
                  onChange={toggleReminders}
                />
              </span>
            </div>
            <SettingsRow label="Remind me" value={remindersSummary(reminders.days)} onClick={() => setRemindSheet(true)} chevron />
          </SettingsGroup>
          {remindersDenied && (
            <p className="mt-2 px-6 text-slate-600 type-caption">
              Turn on notifications for Stackd in your iPhone settings. <OpenSettingsLink />
            </p>
          )}
        </>
      )}

      <h2 className="mt-6 px-6 text-navy-900 type-title-3">Account</h2>
      <SettingsGroup className="mx-4 mt-3">
        <SettingsRow label="Email" value={user?.email ?? undefined} />
        {/* An Apple or Google account has no password to change */}
        {user?.hasPassword !== false && (
          <SettingsRow
            label="Change password"
            onClick={changePassword}
            chevron
            disabled={sending}
            trailing={sending ? <Spinner className="text-navy-900" /> : undefined}
          />
        )}
      </SettingsGroup>

      <SettingsGroup className="mx-4 mt-6">
        <SettingsRow label="Sign out" onClick={signOut} disabled={leaving} />
      </SettingsGroup>

      <SettingsGroup className="mx-4 mt-6">
        <SettingsRow label="Delete account" labelTone="danger" onClick={() => setSheetOpen(true)} />
      </SettingsGroup>

      <footer className="mt-6 px-4 text-center">
        <UnofficialFooter />
        <p className="mt-2 flex justify-center gap-6">
          <TextLink href="/terms" size="label" className="-mx-2.5 px-2.5">
            Terms
          </TextLink>
          <TextLink href="/privacy" size="label" className="-mx-2.5 px-2.5">
            Privacy
          </TextLink>
          <TextLink href="/support/" size="label" className="-mx-2.5 px-2.5">
            Support
          </TextLink>
        </p>
        <p className="mt-2 text-slate-600 tabular-nums type-caption">Stackd {process.env.NEXT_PUBLIC_APP_VERSION}</p>
        <p className="mt-1 text-slate-600 type-caption">{DEVELOPER_CREDIT}</p>
      </footer>

      <BottomSheet
        open={sheetOpen}
        labelledBy={SHEET_TITLE}
        locked={deleting}
        onClose={() => {
          setSheetOpen(false);
          setDeleteFailed(false);
        }}
      >
        <h2 id={SHEET_TITLE} tabIndex={-1} className="text-navy-900 outline-none type-title-2">
          Delete your account?
        </h2>
        <p className="mt-2 text-slate-700 type-body">This deletes your account, your plan, and your progress from Stackd. You can&apos;t undo it.</p>
        <div className="mt-6">
          <Expand open={deleteFailed}>
            <div className="pb-3">
              <InlineError role="alert" title="Couldn't delete your account" body="Check your connection, then try again." />
            </div>
          </Expand>
          <DestructiveButton loading={deleting} onClick={deleteAccount}>
            Delete account
          </DestructiveButton>
        </div>
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            aria-disabled={deleting || undefined}
            onClick={() => {
              if (deleting) return;
              setSheetOpen(false);
              setDeleteFailed(false);
            }}
            className={`-my-3 py-3 type-link ${deleting ? "cursor-default text-blue-600 opacity-40" : "text-blue-600 pressed:underline focus-ring:underline"}`}
          >
            Keep my account
          </button>
        </div>
      </BottomSheet>

      {FEATURES.deadlines && (
        <TermSheet open={termSheet} onClose={() => setTermSheet(false)} term={term.asked ? term.term : undefined} onChoose={chooseTerm} />
      )}

      {reminders.supported && (
        <BottomSheet open={remindSheet} onClose={() => setRemindSheet(false)} labelledBy="remind-me-title">
          <h2 id="remind-me-title" tabIndex={-1} className="text-navy-900 outline-none type-title-2">
            Remind me
          </h2>
          <p className="mt-1 text-slate-600 type-body">For every date you haven&apos;t set yourself.</p>
          <ChoiceList role="group" aria-label="Remind me" className="mt-4">
            {REMINDER_DAYS.map((days) => (
              <ChoiceRow
                key={days}
                role="checkbox"
                checked={reminders.days.includes(days)}
                name={REMINDER_LABELS[days]}
                onSelect={() => setDefaultReminders(toggleDay(reminders.days, days))}
              />
            ))}
          </ChoiceList>
        </BottomSheet>
      )}

      <FlashToast bottom={TOAST_BOTTOM} />
      {toast && <Toast key={toast.key} message={toast.text} bottom={TOAST_BOTTOM} onDone={() => setToast(null)} />}
    </main>
  );
}
