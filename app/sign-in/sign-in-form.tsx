"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FocusEvent, type FormEvent, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { EnvelopeIcon, EyeIcon, EyeSlashIcon, LockIcon } from "@phosphor-icons/react/ssr";
import { Expand } from "@/components/ui/expand";
import { InlineError } from "@/components/ui/inline-error";
import { LabelledDivider } from "@/components/ui/labelled-divider";
import { PrimaryButton } from "@/components/ui/primary-button";
import { SocialButton } from "@/components/ui/social-button";
import { TextField } from "@/components/ui/text-field";
import { TextLink } from "@/components/ui/text-link";
import { auth, type AuthError, type OAuthProvider } from "@/lib/auth";
import { getCarriedEmail, setCarriedEmail } from "@/lib/auth/email-store";

type Pending = null | "password" | OAuthProvider;
type FieldErrors = { email?: string; password?: string };
type ErrorCopy = { title: string; body: string };

const PROVIDER_NAME: Record<OAuthProvider, string> = { apple: "Apple", google: "Google" };

function emailError(input: HTMLInputElement) {
  if (!input.value.trim()) return "Enter your email.";
  if (input.validity.typeMismatch) return "Enter an email like name@example.com.";
  return undefined;
}

function passwordError(value: string) {
  return value ? undefined : "Enter your password.";
}

function errorCopy(error: AuthError, provider?: OAuthProvider): ErrorCopy | null {
  switch (error) {
    case "invalid_credentials":
      return { title: "Couldn't sign you in", body: "That email and password don't match. Check them, or reset your password." };
    case "network":
      return { title: "Couldn't reach Stackd", body: "Check your connection, then try again." };
    case "oauth_failed":
      return { title: `Couldn't sign in with ${provider ? PROVIDER_NAME[provider] : "that account"}`, body: "Try again, or sign in with your email." };
    // The student backed out on purpose, and sign-in never returns email_taken.
    case "oauth_cancelled":
    case "email_taken":
      return null;
  }
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
  const [authError, setAuthError] = useState<ErrorCopy | null>(null);
  const [pending, setPending] = useState<Pending>(null);

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
    setPending("password");
    const result = await auth.signInWithPassword(email, password);
    if (result.ok) return goHome();
    setPending(null);
    setAuthError(errorCopy(result.error));
  }

  async function onOAuth(provider: OAuthProvider) {
    if (busy) return;
    setAuthError(null);
    setPending(provider);
    const result = await auth.signInWithOAuth(provider);
    if (result.ok) return goHome();
    setPending(null);
    setAuthError(errorCopy(result.error, provider));
  }

  function togglePassword() {
    const input = passwordRef.current;
    const focused = input !== null && document.activeElement === input;
    const start = input?.selectionStart ?? null;
    const end = input?.selectionEnd ?? null;
    flushSync(() => setShowPassword((v) => !v));
    if (input && focused) {
      input.focus();
      input.setSelectionRange(start, end);
      // Chromium moves the caret again after a mouse click on the type change, so restore it once more.
      requestAnimationFrame(() => input.setSelectionRange(start, end));
    }
  }

  // Keeps the focused field above the on-screen keyboard.
  function onFocus(e: FocusEvent<HTMLFormElement>) {
    const field = e.target;
    if (!(field instanceof HTMLInputElement)) return;
    setTimeout(() => {
      const vv = window.visualViewport;
      if (!vv || document.activeElement !== field) return;
      const r = field.getBoundingClientRect();
      if (r.bottom > vv.offsetTop + vv.height || r.top < vv.offsetTop) field.scrollIntoView({ block: "center" });
    }, 300);
  }

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      onFocus={onFocus}
      className="relative z-[1] mx-4 flex flex-1 flex-col rounded-t-lg bg-surface px-4 pt-5 shadow-[0_-8px_24px_rgba(5,16,66,.06)]"
      style={{ paddingBottom: "calc(16px + var(--safe-bottom))" }}
    >
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
        trailing={
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            onMouseDown={(e) => {
              if (document.activeElement === passwordRef.current) e.preventDefault();
            }}
            onClick={togglePassword}
            className="flex size-11 items-center justify-center rounded-sm text-slate-600"
          >
            {showPassword ? <EyeSlashIcon size={22} aria-hidden /> : <EyeIcon size={22} aria-hidden />}
          </button>
        }
      />

      <TextLink href="/forgot-password" size="label" className="mt-2 self-end">
        Forgot password?
      </TextLink>

      <div className="mt-4">
        <Expand open={authError !== null}>
          <div className="pb-3">
            {authError && <InlineError role="alert" title={authError.title} body={authError.body} />}
          </div>
        </Expand>
        <PrimaryButton type="submit" loading={pending === "password"} disabled={pending === "apple" || pending === "google"}>
          Sign in
        </PrimaryButton>
      </div>

      <div className="mt-3">
        <LabelledDivider label="or" />
      </div>

      <div className="mt-3 flex flex-col gap-3">
        <SocialButton logo={appleLogo} loading={pending === "apple"} disabled={busy && pending !== "apple"} onClick={() => onOAuth("apple")}>
          Continue with Apple
        </SocialButton>
        <SocialButton logo={googleLogo} loading={pending === "google"} disabled={busy && pending !== "google"} onClick={() => onOAuth("google")}>
          Continue with Google
        </SocialButton>
      </div>

      <p className="mt-auto flex flex-wrap items-center justify-center gap-x-1.5 pt-5 text-center">
        <span className="text-slate-600 type-body">New to stackd?</span>
        <TextLink href="/sign-up" replace className="whitespace-nowrap">
          Create an account
        </TextLink>
      </p>
    </form>
  );
}
