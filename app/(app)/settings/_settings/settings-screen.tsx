"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BackButton } from "@/components/back-button";
import { FlashToast } from "@/components/flash-toast";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { DestructiveButton } from "@/components/ui/destructive-button";
import { Expand } from "@/components/ui/expand";
import { InlineError } from "@/components/ui/inline-error";
import { Loading } from "@/components/ui/loading";
import { SettingsGroup, SettingsRow } from "@/components/ui/settings-row";
import { Spinner } from "@/components/ui/spinner";
import { TextLink } from "@/components/ui/text-link";
import { TintedButton } from "@/components/ui/tinted-button";
import { Toast } from "@/components/ui/toast";
import { UnofficialFooter } from "@/components/ui/unofficial-footer";
import { auth } from "@/lib/auth";
import { setCarriedEmail } from "@/lib/auth/email-store";
import { inlineErrorCopy } from "@/lib/auth/messages";
import { retryPlan, usePlan, type Plan } from "@/lib/data/plan";
import { DEMO_MODE } from "@/lib/flags";
import { setFlash } from "@/lib/flash";
import { onboardingUrl } from "@/lib/onboarding";
import { readSessionUser } from "@/lib/profile";
import { markWelcomeSeen } from "@/lib/session";

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
  const names = [...new Set(plan.targets.flatMap((t) => (t.majorName ? [t.majorName] : [])))];
  if (names.length === 0) return { text: "Not listed yet" };
  return { text: names.length === 1 ? names[0] : `${names.length} majors` };
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
        </p>
        <p className="mt-2 text-slate-600 tabular-nums type-caption">Stackd {process.env.NEXT_PUBLIC_APP_VERSION}</p>
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

      <FlashToast bottom={TOAST_BOTTOM} />
      {toast && <Toast key={toast.key} message={toast.text} bottom={TOAST_BOTTOM} onDone={() => setToast(null)} />}
    </main>
  );
}
