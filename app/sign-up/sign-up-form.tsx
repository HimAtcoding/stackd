"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode, type RefObject } from "react";
import { flushSync } from "react-dom";
import { EnvelopeIcon, LockIcon, UserIcon } from "@phosphor-icons/react/ssr";
import { AuthSheet } from "@/components/auth/auth-sheet";
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
import { getCarriedEmail, getCarriedSignUp, setCarriedEmail, setCarriedSignUp } from "@/lib/auth/email-store";
import { WEAK_PASSWORD, emailError, inlineErrorCopy, oauthErrorCopy, type ErrorCopy } from "@/lib/auth/messages";
import { AFTER_SIGN_UP } from "@/lib/onboarding";

type FieldErrors = { firstName?: string; email?: string; password?: string };
type AccountError = ErrorCopy & { signIn?: boolean };

const MIN_PASSWORD = 8;

const EMAIL_TAKEN: AccountError = {
  title: "That email already has an account",
  body: "Sign in with it, or use a different email.",
  signIn: true,
};

function firstNameError(value: string) {
  return value.trim() ? undefined : "Enter your first name.";
}

function passwordError(value: string) {
  if (!value) return "Create a password.";
  if (value.length < MIN_PASSWORD) return "Use at least 8 characters.";
  return undefined;
}

// Enter on a "next" field moves to the following one instead of submitting.
function nextOnEnter(e: KeyboardEvent, target: RefObject<HTMLInputElement | null>) {
  if (e.key !== "Enter") return;
  e.preventDefault();
  target.current?.focus();
}

type SignUpFormProps = { appleLogo: ReactNode; googleLogo: ReactNode };

export function SignUpForm({ appleLogo, googleLogo }: SignUpFormProps) {
  const router = useRouter();
  const firstNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Kept in memory while the student is on Enter code, so Back shows every field still filled in (07)
  const [firstName, setFirstName] = useState(() => getCarriedSignUp().firstName);
  const [email, setEmail] = useState(getCarriedEmail);
  const [password, setPassword] = useState(() => getCarriedSignUp().password);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  // After a failed submit, each field re-checks as it changes.
  const [recheck, setRecheck] = useState(false);
  const [accountError, setAccountError] = useState<AccountError | null>(null);
  const [pending, setPending] = useState<null | "form" | OAuthProvider>(null);

  const busy = pending !== null;

  function goHome() {
    router.replace("/", { transitionTypes: ["crossfade"] });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy || !emailRef.current) return;

    const next = {
      firstName: firstNameError(firstName),
      email: emailError(emailRef.current),
      password: passwordError(password),
    };
    if (next.firstName || next.email || next.password) {
      flushSync(() => {
        setErrors(next);
        setRecheck(true);
      });
      const first = next.firstName ? firstNameRef : next.email ? emailRef : passwordRef;
      first.current?.focus();
      return;
    }

    setErrors({});
    setAccountError(null);
    setPending("form");
    const result = await auth.signUp(firstName.trim(), email, password);
    if (result.ok && !result.needsCode) {
      // A new account starts with onboarding (10); demo mode goes straight to Home
      setCarriedSignUp({ firstName: "", password: "" });
      return router.replace(AFTER_SIGN_UP, { transitionTypes: ["crossfade"] });
    }
    if (result.ok) {
      // Confirm email is on: the account waits for the emailed code (09)
      setPending(null);
      setCarriedEmail(email.trim());
      setCarriedSignUp({ firstName, password });
      return router.push("/enter-code/?for=confirm");
    }
    setPending(null);
    if (result.error === "weak_password") {
      setErrors((prev) => ({ ...prev, password: WEAK_PASSWORD }));
      passwordRef.current?.focus();
    } else {
      setAccountError(result.error === "email_taken" ? EMAIL_TAKEN : inlineErrorCopy(result.error));
    }
  }

  async function onOAuth(provider: OAuthProvider) {
    if (busy) return;
    setAccountError(null);
    setPending(provider);
    const result = await auth.signInWithOAuth(provider);
    if (result.ok) return goHome();
    setPending(null);
    setAccountError(oauthErrorCopy(result.error, provider));
  }

  return (
    <AuthSheet onSubmit={onSubmit}>
      <TextField
        ref={firstNameRef}
        id="first-name"
        name="given-name"
        label="First name"
        type="text"
        autoComplete="given-name"
        autoCapitalize="words"
        enterKeyHint="next"
        icon={<UserIcon size={22} />}
        value={firstName}
        readOnly={busy}
        error={errors.firstName}
        onChange={(e) => {
          setFirstName(e.target.value);
          setAccountError(null);
          if (recheck) setErrors((prev) => ({ ...prev, firstName: firstNameError(e.target.value) }));
        }}
        onKeyDown={(e) => nextOnEnter(e, emailRef)}
      />

      <TextField
        ref={emailRef}
        id="email"
        name="email"
        label="Email"
        className="mt-4"
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
          setAccountError(null);
          if (recheck) setErrors((prev) => ({ ...prev, email: emailError(e.target) }));
        }}
        onKeyDown={(e) => nextOnEnter(e, passwordRef)}
      />

      <TextField
        ref={passwordRef}
        id="password"
        name="password"
        label="Password"
        className="mt-4"
        type={showPassword ? "text" : "password"}
        autoComplete="new-password"
        autoCapitalize="off"
        spellCheck={false}
        enterKeyHint="go"
        icon={<LockIcon size={22} />}
        hint="At least 8 characters."
        value={password}
        readOnly={busy}
        error={errors.password}
        onChange={(e) => {
          setPassword(e.target.value);
          setAccountError(null);
          if (recheck) setErrors((prev) => ({ ...prev, password: passwordError(e.target.value) }));
        }}
        trailing={<PasswordToggle inputRef={passwordRef} shown={showPassword} setShown={setShowPassword} />}
      />

      <div className="mt-4">
        <Expand open={accountError !== null}>
          <div className="pb-3">
            {accountError && (
              <InlineError
                role="alert"
                title={accountError.title}
                body={accountError.body}
                action={
                  accountError.signIn ? (
                    <TintedButton onClick={() => router.replace("/sign-in")}>Sign in</TintedButton>
                  ) : undefined
                }
              />
            )}
          </div>
        </Expand>
        <PrimaryButton type="submit" loading={pending === "form"} disabled={pending === "apple" || pending === "google"}>
          Create account
        </PrimaryButton>
      </div>

      <SocialSignIn appleLogo={appleLogo} googleLogo={googleLogo} pending={pending} onOAuth={onOAuth} />

      <SwitchLine text="Already have an account?" link="Sign in" href="/sign-in" />

      <p className="mx-auto mt-3 max-w-[300px] text-center text-slate-600 type-caption">
        By creating an account, you agree to the{" "}
        <TextLink href="/terms" size="caption">
          Terms
        </TextLink>{" "}
        and{" "}
        <TextLink href="/privacy" size="caption">
          Privacy Policy
        </TextLink>
        .
      </p>
    </AuthSheet>
  );
}
