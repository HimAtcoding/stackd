"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { EnvelopeIcon } from "@phosphor-icons/react/ssr";
import { AuthSheet } from "@/components/auth/auth-sheet";
import { SwitchLine } from "@/components/auth/switch-line";
import { BackButton } from "@/components/back-button";
import { Expand } from "@/components/ui/expand";
import { InlineError } from "@/components/ui/inline-error";
import { PrimaryButton } from "@/components/ui/primary-button";
import { TextField } from "@/components/ui/text-field";
import { auth } from "@/lib/auth";
import { getCarriedEmail, setCarriedEmail } from "@/lib/auth/email-store";
import { emailError, inlineErrorCopy, type ErrorCopy } from "@/lib/auth/messages";

// Rev 3 (08): the request form only. The emailed code, resending and the new password are on Enter code (09).
// The husky is rendered on the server and passed in.
export function ForgotPasswordFlow({ husky }: { husky: ReactNode }) {
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState(getCarriedEmail);
  const [error, setError] = useState<string | undefined>();
  const [recheck, setRecheck] = useState(false);
  const [sendError, setSendError] = useState<ErrorCopy | null>(null);
  const [sending, setSending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (sending || !emailRef.current) return;

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
    setSendError(null);
    setSending(true);
    const result = await auth.sendPasswordReset(email);
    setSending(false);
    if (!result.ok) {
      setSendError(inlineErrorCopy(result.error));
      return;
    }
    // Unregistered emails move on too: saying which emails have accounts would tell anyone who types one in
    setCarriedEmail(email.trim());
    router.push("/enter-code/?for=reset");
  }

  return (
    <>
      <div className="relative px-4 pb-6" style={{ paddingTop: "calc(var(--safe-top) + 8px)" }}>
        <BackButton fallback="/sign-in" />
        <div className="relative z-[1] px-2">
          <h1 className="mt-6 max-w-[200px] text-navy-900 type-display">Reset your password</h1>
          <p className="mt-2 max-w-[190px] text-navy-900 type-body-md">We&apos;ll email you a code to reset it.</p>
        </div>
        {husky}
      </div>

      <AuthSheet onSubmit={onSubmit}>
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
              setSendError(null);
              if (recheck) setError(emailError(e.target));
            }}
          />
          <div className="mt-4">
            <Expand open={sendError !== null}>
              <div className="pb-3">{sendError && <InlineError role="alert" title={sendError.title} body={sendError.body} />}</div>
            </Expand>
            <PrimaryButton type="submit" loading={sending}>
              Send code
            </PrimaryButton>
          </div>
          <SwitchLine text="Remembered it?" link="Sign in" href="/sign-in" />
        </div>
      </AuthSheet>
    </>
  );
}
