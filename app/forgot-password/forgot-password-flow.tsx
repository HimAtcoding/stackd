"use client";

import { useRouter } from "next/navigation";
import { ViewTransition, startTransition, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { EnvelopeIcon, EnvelopeSimpleOpenIcon } from "@phosphor-icons/react/ssr";
import { AuthSheet } from "@/components/auth/auth-sheet";
import { SwitchLine } from "@/components/auth/switch-line";
import { BackButton } from "@/components/back-button";
import { Expand } from "@/components/ui/expand";
import { InlineError } from "@/components/ui/inline-error";
import { PrimaryButton } from "@/components/ui/primary-button";
import { TextField } from "@/components/ui/text-field";
import { Toast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { auth } from "@/lib/auth";
import { getCarriedEmail, setCarriedEmail } from "@/lib/auth/email-store";
import { NETWORK_ERROR, emailError } from "@/lib/auth/messages";

type Stage = "request" | "sent";

const RESEND_SECONDS = 30;

type ToastMessage = { key: number; text: string };

// The husky is rendered on the server (the art check reads /public) and passed in.
export function ForgotPasswordFlow({ husky }: { husky: ReactNode }) {
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const swapped = useRef(false);

  const [stage, setStage] = useState<Stage>("request");
  const [email, setEmail] = useState(getCarriedEmail);
  const [sentTo, setSentTo] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [recheck, setRecheck] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [sending, setSending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Headline and sheet contents crossfade over 200 ms; under reduced motion the swap is instant.
  function show(next: Stage) {
    swapped.current = true;
    setNetworkError(false);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setStage(next);
    else startTransition(() => setStage(next));
  }

  // Focus moves to the new headline after each swap.
  useEffect(() => {
    if (swapped.current) headingRef.current?.focus();
  }, [stage]);

  // Resend countdown, one tick a second.
  useEffect(() => {
    if (stage !== "sent" || secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [stage, secondsLeft]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (stage !== "request" || sending || !emailRef.current) return;

    const message = emailError(emailRef.current);
    if (message) {
      flushSync(() => {
        setError(message);
        setRecheck(true);
      });
      emailRef.current.focus();
      return;
    }

    setError(undefined);
    setNetworkError(false);
    setSending(true);
    const result = await auth.sendPasswordReset(email);
    setSending(false);
    if (!result.ok) {
      setNetworkError(true);
      return;
    }
    setSentTo(email.trim());
    setSecondsLeft(RESEND_SECONDS);
    show("sent");
  }

  async function resend() {
    if (sending || secondsLeft > 0) return;
    setNetworkError(false);
    setSending(true);
    const result = await auth.sendPasswordReset(sentTo);
    setSending(false);
    // A failed resend leaves the screen as it is and lets the student try again right away.
    if (!result.ok) {
      setSecondsLeft(0);
      setToast({ key: Date.now(), text: "Couldn't send the link. Check your connection, then try again." });
      return;
    }
    setSecondsLeft(RESEND_SECONDS);
    setToast({ key: Date.now(), text: "Reset link sent" });
  }

  const networkAlert = (
    <Expand open={networkError}>
      <div className="pb-3">
        {networkError && <InlineError role="alert" title={NETWORK_ERROR.title} body={NETWORK_ERROR.body} />}
      </div>
    </Expand>
  );

  return (
    <>
      <div className="relative px-4 pb-6" style={{ paddingTop: "calc(var(--safe-top) + var(--strip-h) + 8px)" }}>
        <BackButton fallback="/sign-in" onBack={stage === "sent" ? () => show("request") : undefined} />
        <ViewTransition key={stage}>
          <div className="relative z-[1] px-2">
            <h1 ref={headingRef} tabIndex={-1} className="mt-6 max-w-[200px] text-navy-900 outline-none type-display">
              {stage === "request" ? "Reset your password" : "Check your email"}
            </h1>
            <p className="mt-2 max-w-[190px] text-navy-900 type-body-md">
              {stage === "request" ? (
                "We'll email you a link to reset it."
              ) : (
                <>
                  We sent a link to <span className="font-semibold break-all">{sentTo}</span>.
                </>
              )}
            </p>
          </div>
        </ViewTransition>
        {husky}
      </div>

      <AuthSheet onSubmit={onSubmit}>
        <ViewTransition key={stage}>
          {stage === "request" ? (
            <div className="flex flex-1 flex-col">
              <TextField
                ref={emailRef}
                id="email"
                name="email"
                label="Email"
                type="email"
                autoComplete="email"
                inputMode="email"
                autoCapitalize="off"
                spellCheck={false}
                enterKeyHint="send"
                placeholder="you@example.com"
                icon={<EnvelopeIcon size={22} />}
                value={email}
                readOnly={sending}
                error={error}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setCarriedEmail(e.target.value);
                  setNetworkError(false);
                  if (recheck) setError(emailError(e.target));
                }}
              />
              <div className="mt-4">
                {networkAlert}
                <PrimaryButton type="submit" loading={sending}>
                  Send reset link
                </PrimaryButton>
              </div>
              <SwitchLine text="Remembered it?" link="Sign in" href="/sign-in" />
            </div>
          ) : (
            <div className="flex flex-col items-center text-center">
              <span aria-hidden className="mt-3 flex size-18 items-center justify-center rounded-full bg-tint-sky text-blue-600">
                <EnvelopeSimpleOpenIcon weight="fill" size={32} />
              </span>
              <p className="mt-4 max-w-[280px] text-slate-600 type-body">
                If there&apos;s an account for this email, the link will arrive in a few minutes. Check your spam folder too.
              </p>
              <div className="mt-6 w-full">
                <PrimaryButton onClick={() => router.replace("/sign-in")}>Back to sign in</PrimaryButton>
              </div>
              <div className="mt-3">
                <button
                  type="button"
                  aria-live="off"
                  aria-disabled={secondsLeft > 0 || sending || undefined}
                  onClick={resend}
                  className={cn(
                    "-my-3 py-3 type-link",
                    secondsLeft > 0 || sending ? "cursor-default text-slate-600" : "text-blue-600 pressed:underline focus-ring:underline",
                  )}
                >
                  {secondsLeft > 0 ? `Send again in ${secondsLeft}s` : "Send again"}
                </button>
              </div>
            </div>
          )}
        </ViewTransition>
      </AuthSheet>

      {toast && (
        <Toast
          key={toast.key}
          message={toast.text}
          bottom="calc(var(--safe-bottom) + 12px)"
          onDone={() => setToast(null)}
        />
      )}
    </>
  );
}
