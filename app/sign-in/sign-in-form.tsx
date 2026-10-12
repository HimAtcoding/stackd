"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { EnvelopeIcon, LockIcon } from "@phosphor-icons/react/ssr";
import { AuthSheet } from "@/components/auth/auth-sheet";
import { FlashToast } from "@/components/flash-toast";
import { PasswordToggle } from "@/components/auth/password-toggle";
import { SocialSignIn } from "@/components/auth/social-sign-in";
import { SwitchLine } from "@/components/auth/switch-line";
import { Expand } from "@/components/ui/expand";
import { InlineError } from "@/components/ui/inline-error";
import { PrimaryButton } from "@/components/ui/primary-button";
import { TextField } from "@/components/ui/text-field";
import { TextLink } from "@/components/ui/text-link";
import { TintedButton } from "@/components/ui/tinted-button";
import { auth, type OAuthProvider } from "@/lib/auth";
import { getCarriedEmail, setCarriedEmail } from "@/lib/auth/email-store";
import { emailError, emailNotConfirmed, inlineErrorCopy, oauthErrorCopy, returnedOAuthCopy, type ErrorCopy } from "@/lib/auth/messages";
import { clearReturnedOAuthError, usePendingOAuth } from "@/lib/auth/oauth";
import { routeAfterOAuth } from "@/lib/onboarding";

type FieldErrors = { email?: string; password?: string };
// sendCode: the "Confirm your email first" error, with its Send code button
type SignInError = ErrorCopy & { sendCode?: boolean };

const WRONG_PASSWORD: ErrorCopy = {
  title: "Couldn't sign you in",
  body: "That email and password don't match. Check them, or reset your password.",
};

function passwordError(value: string) {
  return value ? undefined : "Enter your password.";
}

type SignInFormProps = { appleLogo: ReactNode; googleLogo: ReactNode };

export function SignInForm({ appleLogo, googleLogo }: SignInFormProps) {
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState(getCarriedEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  // After a failed submit, each field re-checks as it changes.
  const [recheck, setRecheck] = useState(false);
  // An Apple or Google sign-in that failed after leaving the app shows here once (/auth/callback/)
  const [authError, setAuthError] = useState<SignInError | null>(returnedOAuthCopy);
  const [pending, setPending] = usePendingOAuth<"form" | "code" | OAuthProvider>();

  useEffect(() => clearReturnedOAuthError(), []);

  const busy = pending !== null;

  function goHome() {
    router.replace("/", { transitionTypes: ["crossfade"] });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy || !emailRef.current) return;

    const next = { email: emailError(emailRef.current), password: passwordError(password) };
    if (next.email || next.password) {
      flushSync(() => {
        setErrors(next);
        setRecheck(true);
      });
      (next.email ? emailRef : passwordRef).current?.focus();
      return;
    }

    setErrors({});
    setAuthError(null);
    setPending("form");
    const result = await auth.signInWithPassword(email, password);
    if (result.ok) return goHome();
    setPending(null);
    if (result.error === "invalid_credentials") setAuthError(WRONG_PASSWORD);
    else if (result.error === "email_not_confirmed") setAuthError({ ...emailNotConfirmed(email), sendCode: true });
    else setAuthError(inlineErrorCopy(result.error));
  }

  // Sends a confirmation code, then opens Enter code (09). A failed send shows its own error here.
  async function sendCode() {
    if (busy) return;
    setPending("code");
    const result = await auth.resendSignUpCode(email);
    setPending(null);
    if (!result.ok) return setAuthError(inlineErrorCopy(result.error));
    setCarriedEmail(email.trim());
    router.push("/enter-code/?for=confirm");
  }

  async function onOAuth(provider: OAuthProvider) {
    if (busy) return;
    setAuthError(null);
    setPending(provider);
    const result = await auth.signInWithOAuth(provider);
    if (result.ok) {
      // On the way to Apple or Google, the button keeps spinning until the page changes
      if (!result.redirecting) router.replace(await routeAfterOAuth(), { transitionTypes: ["crossfade"] });
      return;
    }
    setPending(null);
    setAuthError(oauthErrorCopy(result.error, provider));
  }

  return (
    <AuthSheet onSubmit={onSubmit}>
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
        enterKeyHint="next"
        placeholder="you@example.com"
        icon={<EnvelopeIcon size={22} />}
        value={email}
        readOnly={busy}
        error={errors.email}
        onChange={(e) => {
          setEmail(e.target.value);
          setCarriedEmail(e.target.value);
          setAuthError(null);
          if (recheck) setErrors((prev) => ({ ...prev, email: emailError(e.target) }));
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            passwordRef.current?.focus();
          }
        }}
      />

      <TextField
        ref={passwordRef}
        id="password"
        name="password"
        label="Password"
        className="mt-4"
        type={showPassword ? "text" : "password"}
        autoComplete="current-password"
        autoCapitalize="off"
        spellCheck={false}
        enterKeyHint="go"
        icon={<LockIcon size={22} />}
        value={password}
        readOnly={busy}
        error={errors.password}
        onChange={(e) => {
          setPassword(e.target.value);
          setAuthError(null);
          if (recheck) setErrors((prev) => ({ ...prev, password: passwordError(e.target.value) }));
        }}
        trailing={<PasswordToggle inputRef={passwordRef} shown={showPassword} setShown={setShowPassword} />}
      />

      <TextLink href="/forgot-password" size="label" className="mt-2 self-end">
        Forgot password?
      </TextLink>

      <div className="mt-4">
        <Expand open={authError !== null}>
          <div className="pb-3">
            {authError && (
              <InlineError
                role="alert"
                title={authError.title}
                body={authError.body}
                action={
                  authError.sendCode ? (
                    <TintedButton onClick={sendCode}>
                      {pending === "code" ? "Sending…" : "Send code"}
                    </TintedButton>
                  ) : undefined
                }
              />
            )}
          </div>
        </Expand>
        <PrimaryButton type="submit" loading={pending === "form"} disabled={pending === "apple" || pending === "google" || pending === "code"}>
          Sign in
        </PrimaryButton>
      </div>

      {/* Sending a code disables the social buttons the same way a sign-in does */}
      <SocialSignIn appleLogo={appleLogo} googleLogo={googleLogo} pending={pending === "code" ? "form" : pending} onOAuth={onOAuth} />

      <SwitchLine text="New to stackd?" link="Create an account" href="/sign-up" />
      {/* "Signed out", arriving from Settings (11) */}
      <FlashToast bottom="calc(var(--safe-bottom) + 12px)" />
    </AuthSheet>
  );
}
