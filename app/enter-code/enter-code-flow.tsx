"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ViewTransition, startTransition, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { LockIcon } from "@phosphor-icons/react/ssr";
import { AuthSheet } from "@/components/auth/auth-sheet";
import { PasswordToggle } from "@/components/auth/password-toggle";
import { SwitchLine } from "@/components/auth/switch-line";
import { BackButton } from "@/components/back-button";
import { CodeField } from "@/components/ui/code-field";
import { Expand } from "@/components/ui/expand";
import { InlineError } from "@/components/ui/inline-error";
import { PrimaryButton } from "@/components/ui/primary-button";
import { TextField } from "@/components/ui/text-field";
import { Toast } from "@/components/ui/toast";
import { auth } from "@/lib/auth";
import { getCarriedEmail, setCarriedSignUp } from "@/lib/auth/email-store";
import { CODE_INCOMPLETE, CODE_INVALID, SAME_PASSWORD, WEAK_PASSWORD, inlineErrorCopy, type ErrorCopy } from "@/lib/auth/messages";
import type { CodePurpose } from "@/lib/auth/types";
import { cn } from "@/lib/cn";
import { setFlash } from "@/lib/flash";
import { AFTER_SIGN_UP } from "@/lib/onboarding";
import { hasSession } from "@/lib/session";

type Step = "code" | "password";

// Supabase allows one email per address per minute
const RESEND_SECONDS = 60;
const MIN_PASSWORD = 8;

const HEADLINE: Record<CodePurpose, string> = { reset: "Enter your code", confirm: "Confirm your email" };

function newPasswordError(value: string) {
  if (!value) return "Create a password.";
  if (value.length < MIN_PASSWORD) return "Use at least 8 characters.";
  return undefined;
}

type ToastMessage = { key: number; text: string };

// 09: the code step (both purposes), then for a reset the new password step, on the same route.
export function EnterCodeFlow({ huskies }: { huskies: Record<CodePurpose, ReactNode> }) {
  const router = useRouter();
  const param = useSearchParams().get("for");
  const purpose: CodePurpose | null = param === "reset" || param === "confirm" ? param : null;
  // The email arrives in memory only, so a reload (or iOS closing the app) leaves this empty
  const [email] = useState(() => getCarriedEmail().trim());
  const missing = !purpose || !email;
  // Already signed in when the screen opened: they came from Settings → Change password (11), not Forgot password
  const [fromSettings] = useState(() => purpose === "reset" && hasSession());
  const start = fromSettings ? "/settings/" : purpose === "reset" ? "/forgot-password" : "/sign-in";

  const codeRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const swapped = useRef(false);

  const [step, setStep] = useState<Step>("code");
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | undefined>();
  const [inlineError, setInlineError] = useState<ErrorCopy | null>(null);
  const [checking, setChecking] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [resending, setResending] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [recheck, setRecheck] = useState(false);
  const [saving, setSaving] = useState(false);

  // Nothing is shown without an email: the student starts again where they came from
  useEffect(() => {
    if (missing) router.replace(start);
  }, [missing, start, router]);

  // Opens the keypad on arrival. iOS may still want a tap, which the boxes take.
  useEffect(() => {
    if (!missing) codeRef.current?.focus();
  }, [missing]);

  // The resend count starts with the screen, because a code was just sent
  useEffect(() => {
    if (step !== "code" || secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [step, secondsLeft]);

  // Focus moves to the new headline after the swap, so screen readers announce the step
  useEffect(() => {
    if (swapped.current) headingRef.current?.focus();
  }, [step]);

  if (missing || !purpose) return null;
  const resetting = purpose === "reset";

  // The message shows as a toast on the screen that opens
  function leave(message: string, to: string) {
    setFlash(message);
    setCarriedSignUp({ firstName: "", password: "" });
    router.replace(to, { transitionTypes: ["crossfade"] });
  }

  // Top block and sheet crossfade over 200 ms; under reduced motion the swap is instant
  function showPasswordStep() {
    swapped.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setStep("password");
    else startTransition(() => setStep("password"));
  }

  async function check(value: string) {
    if (checking) return;
    setInlineError(null);
    setChecking(true);
    const result = resetting ? await auth.verifyResetCode(email, value) : await auth.verifySignUpCode(email, value);
    setChecking(false);
    // A confirmed account has no plan yet, so it starts with onboarding (10)
    if (result.ok) return resetting ? showPasswordStep() : leave("Email confirmed", AFTER_SIGN_UP);
    if (result.error === "invalid_code") {
      setCode("");
      setCodeError(CODE_INVALID);
      codeRef.current?.focus();
    } else {
      setInlineError(inlineErrorCopy(result.error));
    }
  }

  function onVerify(e: FormEvent) {
    e.preventDefault();
    if (code.length < 6) {
      setCodeError(CODE_INCOMPLETE);
      codeRef.current?.focus();
      return;
    }
    check(code);
  }

  async function resend() {
    if (resending || secondsLeft > 0) return;
    setResending(true);
    const result = resetting ? await auth.sendPasswordReset(email) : await auth.resendSignUpCode(email);
    setResending(false);
    if (result.ok) {
      setToast({ key: Date.now(), text: "New code sent" });
      setCode("");
      setCodeError(undefined);
      setInlineError(null);
      setSecondsLeft(RESEND_SECONDS);
      codeRef.current?.focus();
    } else if (result.error === "rate_limited") {
      setToast({ key: Date.now(), text: "Wait a minute before sending another code." });
      setSecondsLeft(RESEND_SECONDS);
    } else {
      setToast({ key: Date.now(), text: "Couldn't send a new code. Check your connection, then try again." });
    }
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    const message = newPasswordError(password);
    if (message) {
      flushSync(() => {
        setPasswordError(message);
        setRecheck(true);
      });
      passwordRef.current?.focus();
      return;
    }
    setInlineError(null);
    setSaving(true);
    const result = await auth.setNewPassword(password);
    if (result.ok) return leave("Password saved", "/");
    setSaving(false);
    if (result.error === "same_password" || result.error === "weak_password") {
      setPasswordError(result.error === "same_password" ? SAME_PASSWORD : WEAK_PASSWORD);
      passwordRef.current?.focus();
    } else {
      setInlineError(inlineErrorCopy(result.error));
    }
  }

  const inlineAlert = (
    <Expand open={inlineError !== null}>
      <div className="pb-3">{inlineError && <InlineError role="alert" title={inlineError.title} body={inlineError.body} />}</div>
    </Expand>
  );

  // Wraps only inside an address too long for a line of its own, so short ones move down whole (09 says break-all).
  // The address's last character and the closing period can't be split, so the period never ends up alone on a line.
  const emailText = (
    <span className="[overflow-wrap:anywhere]">
      <span className="font-semibold">{email.slice(0, -1)}</span>
      <span className="whitespace-nowrap">
        <span className="font-semibold">{email.slice(-1)}</span>.
      </span>
    </span>
  );

  return (
    <>
      <div className="relative px-4 pb-6" style={{ paddingTop: "calc(var(--safe-top) + 8px)" }}>
        {/* The code is used up after the new password step opens, so that step has no Back */}
        {step === "code" && <BackButton fallback={start} />}
        <ViewTransition key={step}>
          <div className="relative z-[1] px-2">
            <h1 ref={headingRef} tabIndex={-1} className="mt-6 max-w-[200px] text-navy-900 outline-none type-display">
              {step === "code" ? HEADLINE[purpose] : "Set a new password"}
            </h1>
            <p className="mt-2 max-w-[190px] text-navy-900 type-body-md">
              {step === "code" ? <>We sent a 6-digit code to {emailText}</> : <>For {emailText}</>}
            </p>
          </div>
        </ViewTransition>
        {huskies[purpose]}
      </div>

      <AuthSheet onSubmit={step === "code" ? onVerify : onSave}>
        <ViewTransition key={step}>
          {step === "code" ? (
            <div className="flex flex-1 flex-col">
              <CodeField
                ref={codeRef}
                id="code"
                label="6-digit code"
                value={code}
                readOnly={checking}
                error={codeError}
                onChange={(value) => {
                  setCode(value);
                  setCodeError(undefined);
                  setInlineError(null);
                }}
                onComplete={check}
              />
              <div className="mt-4">
                {inlineAlert}
                <PrimaryButton type="submit" loading={checking}>
                  Verify code
                </PrimaryButton>
              </div>
              <div className="mt-4 text-center">
                {secondsLeft > 0 ? (
                  <p aria-live="off" className="text-slate-600 tabular-nums type-body">
                    Send a new code in {secondsLeft}s
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={resend}
                    aria-disabled={resending || undefined}
                    className={cn("-my-3 py-3 type-link", resending ? "cursor-default text-slate-600" : "text-blue-600 pressed:underline focus-ring:underline")}
                  >
                    {resending ? "Sending…" : "Send a new code"}
                  </button>
                )}
              </div>
              <p className="mx-auto mt-1 max-w-[260px] text-center text-slate-600 type-caption">Not in your inbox? Check your spam folder.</p>
              {/* A signed-in student has no sign-in to go back to */}
              {resetting && !fromSettings && <SwitchLine text="Remembered it?" link="Sign in" href="/sign-in" />}
            </div>
          ) : (
            <div className="flex flex-col">
              {/* Lets iOS save the new password to the right account */}
              <input type="email" autoComplete="username" value={email} hidden readOnly />
              <TextField
                ref={passwordRef}
                id="new-password"
                name="new-password"
                label="New password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                autoCapitalize="off"
                spellCheck={false}
                enterKeyHint="done"
                icon={<LockIcon size={22} />}
                hint="At least 8 characters."
                value={password}
                readOnly={saving}
                error={passwordError}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setInlineError(null);
                  if (recheck) setPasswordError(newPasswordError(e.target.value));
                }}
                trailing={<PasswordToggle inputRef={passwordRef} shown={showPassword} setShown={setShowPassword} />}
              />
              <div className="mt-4">
                {inlineAlert}
                <PrimaryButton type="submit" loading={saving}>
                  Save password
                </PrimaryButton>
              </div>
            </div>
          )}
        </ViewTransition>
      </AuthSheet>

      {toast && <Toast key={toast.key} message={toast.text} bottom="calc(var(--safe-bottom) + 12px)" onDone={() => setToast(null)} />}
    </>
  );
}
