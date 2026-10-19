import {
  isAuthApiError,
  isAuthRetryableFetchError,
  isAuthWeakPasswordError,
  type AuthError as SupabaseAuthError,
  type User,
} from "@supabase/supabase-js";
import { authorizeWithApple, isNativeApp, openForCallback } from "@/lib/capacitor";
import { clearPlan } from "@/lib/data/plan";
import { cancelReminders } from "@/lib/reminders/native";
import { getSupabase } from "@/lib/supabase/client";
import { clearStackdStorage, removeStorage, writeStorage } from "@/lib/storage";
import { createNonce, isNativeCallback, NATIVE_CALLBACK_URL } from "./native";
import { EXPIRED, OAUTH_CALLBACK_PATH, readCallbackParams, rememberOAuth, takePendingOAuth } from "./oauth";
import type { Auth, AuthError, AuthResult, OAuthProvider, OAuthResult, OAuthReturn, SignUpResult } from "./types";

const ok: AuthResult = { ok: true };
type Failure = { ok: false; error: AuthError };
const fail = (error: AuthError): Failure => ({ ok: false, error });

// Progress and the greeting cached on this device belong to whoever is signed in
const PER_ACCOUNT_KEYS = [
  "stackd.profile",
  "stackd.requirements",
  "stackd.saved",
  "stackd.progressOwner",
  "stackd.progressQueue",
  // Deadline marks, checklist steps and the transfer term, and changes to them not yet sent (lib/data/deadlines.ts)
  "stackd.deadlines",
  "stackd.steps",
  "stackd.term",
  "stackd.deadlinesQueue",
  "stackd.stepsUnchecked",
  // Reminder switch, default days and the card's dismissal (lib/reminders)
  "stackd.reminders",
];

// 09 → Supabase mapping. No response, or anything unexpected, is "network"; in development the real code is logged.
function toAuthError(error: SupabaseAuthError | Error): AuthError {
  if (isAuthRetryableFetchError(error) || !isAuthApiError(error)) return "network";
  if (error.code === "same_password") return "same_password";
  if (isAuthWeakPasswordError(error)) return "weak_password";
  switch (error.code) {
    case "invalid_credentials":
      return "invalid_credentials";
    case "user_already_exists":
    case "email_exists":
      return "email_taken";
    case "otp_expired":
      return "invalid_code";
    case "email_not_confirmed":
      return "email_not_confirmed";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "rate_limited";
    default:
      if (process.env.NODE_ENV === "development") console.error("Unexpected Supabase auth error", error.code, error.message);
      return "network";
  }
}

// Home's greeting reads stackd.profile, so the signed-in student's first name is cached there
function cacheFirstName(firstName: unknown) {
  if (typeof firstName === "string" && firstName.trim()) writeStorage("stackd.profile", JSON.stringify({ firstName: firstName.trim() }));
}

const clean = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : null);

// The first name Apple or Google shared, if any. Apple shares the name only on the very first sign-in, and the
// student can share none, so this is often null. Never made up from the email.
function providerFirstName(meta: Record<string, unknown>): string | null {
  const given = clean(meta.given_name);
  if (given) return given;
  const full = clean(meta.full_name) ?? clean(meta.name);
  return full ? full.split(/\s+/)[0] : null;
}

// Greets an Apple or Google student by name when there is one. A name already on the account always wins;
// a shared one is saved to the account so other devices have it too. With none, Home says "Hi there!" (02).
// In the iOS app, Apple's sheet hands the name over itself (appleName); it's never in Apple's identity token.
async function rememberOAuthName(user: User, appleName: string | null = null) {
  const meta = user.user_metadata ?? {};
  const saved = clean(meta.first_name);
  if (saved) return cacheFirstName(saved);
  const shared = providerFirstName(meta) ?? appleName;
  // Never keep a name cached from someone else's session on this device
  if (!shared) return removeStorage("stackd.profile");
  cacheFirstName(shared);
  await client().auth.updateUser({ data: { first_name: shared } });
}

// The first-ever sign-in of a brand-new account: Supabase made the user moments before this sign-in. A returning
// student, or an email account signing in with Apple or Google for the first time, was made long before.
const NEW_ACCOUNT_WINDOW_MS = 60_000;

function isNewAccount(user: User) {
  const created = Date.parse(user.created_at);
  const signedIn = Date.parse(user.last_sign_in_at ?? "");
  return Number.isFinite(created) && Number.isFinite(signedIn) && signedIn - created < NEW_ACCOUNT_WINDOW_MS;
}

// A connection that hangs instead of failing counts as no connection, so the button never spins forever
const SETTINGS_TIMEOUT_MS = 10_000;

// Supabase's public settings list the providers that are switched on. Checking first means one that's off shows
// 06's error on the screen instead of Supabase's raw error page, and no connection shows "Couldn't reach Stackd".
async function providerEnabled(provider: OAuthProvider) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
    headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "" },
    signal: AbortSignal.timeout(SETTINGS_TIMEOUT_MS),
  });
  if (!res.ok) return false;
  const settings = (await res.json()) as { external?: Partial<Record<OAuthProvider, boolean>> };
  return settings.external?.[provider] === true;
}

function client() {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase isn't configured: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return supabase;
}

async function run<T extends AuthResult | SignUpResult | OAuthResult>(fn: () => Promise<T>): Promise<T | Failure> {
  try {
    return await fn();
  } catch (e) {
    return fail(toAuthError(e as Error));
  }
}

// Exchanges the one-time code Apple or Google sent back (web: /auth/callback/; iOS app: the in-app browser's return)
async function exchangeReturn(href: string, provider: OAuthProvider | null): Promise<OAuthReturn> {
  const failed = (error: AuthError): OAuthReturn => ({ ok: false, error, provider });
  const params = readCallbackParams(href);
  if (params.kind === "error") return failed(params.error === "cancelled" ? "oauth_cancelled" : params.error === "expired" ? "oauth_expired" : "oauth_failed");
  if (params.kind === "none") return failed("oauth_failed");
  try {
    const { data, error } = await client().auth.exchangeCodeForSession(params.code);
    if (error) {
      if (process.env.NODE_ENV === "development") console.error("OAuth code exchange failed", error.code ?? error.name);
      if (isAuthRetryableFetchError(error)) return failed("network");
      return failed(EXPIRED.has(error.code ?? "") ? "oauth_expired" : "oauth_failed");
    }
    await rememberOAuthName(data.user).catch(() => {});
    return { ok: true, newAccount: isNewAccount(data.user) };
  } catch (e) {
    return failed(isAuthApiError(e) ? "oauth_failed" : "network");
  }
}

// iOS app, Apple: Apple's own sheet, then Supabase checks Apple's identity token (signInWithIdToken). The App ID
// app.stackd.transfer is in Supabase's Apple Client IDs. Nothing leaves the app, so the screen routes as soon as it's done.
async function signInWithAppleNative(): Promise<OAuthResult | Failure> {
  const nonce = await createNonce();
  const apple = await authorizeWithApple(nonce.hashed);
  if (!apple.ok) return fail(apple.cancelled ? "oauth_cancelled" : "oauth_failed");
  const { data, error } = await client().auth.signInWithIdToken({ provider: "apple", token: apple.identityToken, nonce: nonce.raw });
  if (error || !data.user) {
    if (process.env.NODE_ENV === "development" && error) console.error("Apple ID token sign-in failed", error.code ?? error.name);
    return fail(error && isAuthRetryableFetchError(error) ? "network" : "oauth_failed");
  }
  await rememberOAuthName(data.user, apple.givenName).catch(() => {});
  return { ok: true, redirecting: false, newAccount: isNewAccount(data.user) };
}

// iOS app, Google: the same PKCE sign-in as the web, in the in-app browser, returning to the app's own scheme.
// Google's client secret stays in Supabase. Closing the browser is a cancel.
async function signInInAppBrowser(provider: OAuthProvider): Promise<OAuthResult | Failure> {
  const { data, error } = await client().auth.signInWithOAuth({
    provider,
    options: { redirectTo: NATIVE_CALLBACK_URL, skipBrowserRedirect: true },
  });
  if (error || !data.url) return fail("oauth_failed");
  const back = await openForCallback(data.url, isNativeCallback);
  if (back.kind === "closed") return fail("oauth_cancelled");
  const result = await exchangeReturn(back.url, provider);
  return result.ok ? { ok: true, redirecting: false, newAccount: result.newAccount } : fail(result.error);
}

export const supabaseAuth: Auth = {
  signInWithPassword: (email, password) =>
    run(async () => {
      const { data, error } = await client().auth.signInWithPassword({ email: email.trim(), password });
      if (error) return fail(toAuthError(error));
      cacheFirstName(data.user?.user_metadata.first_name);
      return ok;
    }),

  signUp: (firstName, email, password) =>
    run(async () => {
      const { data, error } = await client().auth.signUp({
        email: email.trim(),
        password,
        // The profiles table copies first_name from here (supabase/migrations → create_profile)
        options: { data: { first_name: firstName } },
      });
      if (error) return fail(toAuthError(error));
      // With Confirm email on, an existing address comes back as a user with no identities, not an error
      if (data.user && data.user.identities?.length === 0) return fail("email_taken");
      cacheFirstName(firstName);
      return { ok: true, needsCode: !data.session };
    }),

  // PKCE (lib/supabase/client.ts): Supabase sends the student to Apple or Google, then back to /auth/callback/
  // with a one-time code that only this browser can exchange
  signInWithOAuth: (provider) =>
    run(async (): Promise<OAuthResult | Failure> => {
      if (!(await providerEnabled(provider))) return fail("oauth_failed");
      if (isNativeApp()) return provider === "apple" ? signInWithAppleNative() : signInInAppBrowser(provider);
      rememberOAuth(provider);
      const { data, error } = await client().auth.signInWithOAuth({
        provider,
        options: { redirectTo: new URL(OAUTH_CALLBACK_PATH, window.location.origin).href, skipBrowserRedirect: true },
      });
      if (error || !data.url) return fail("oauth_failed");
      window.location.assign(data.url);
      return { ok: true, redirecting: true };
    }),

  finishOAuth: (href) => exchangeReturn(href, takePendingOAuth()),

  sendPasswordReset: (email) =>
    run(async () => {
      // Supabase's Reset Password email template shows {{ .Token }}, the 6-digit code
      const { error } = await client().auth.resetPasswordForEmail(email.trim());
      return error ? fail(toAuthError(error)) : ok;
    }),

  verifyResetCode: (email, code) =>
    run(async () => {
      const { error } = await client().auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "recovery" });
      return error ? fail(toAuthError(error)) : ok;
    }),

  setNewPassword: (password) =>
    run(async () => {
      const { error } = await client().auth.updateUser({ password });
      return error ? fail(toAuthError(error)) : ok;
    }),

  verifySignUpCode: (email, code) =>
    run(async () => {
      const { data, error } = await client().auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "signup" });
      if (error) return fail(toAuthError(error));
      cacheFirstName(data.user?.user_metadata.first_name);
      return ok;
    }),

  resendSignUpCode: (email) =>
    run(async () => {
      const { error } = await client().auth.resend({ type: "signup", email: email.trim() });
      return error ? fail(toAuthError(error)) : ok;
    }),

  // This device only: the student's other devices stay signed in
  async signOut() {
    // No reminder stays scheduled for a student who isn't signed in (14 → What gets scheduled)
    await cancelReminders();
    await getSupabase()?.auth.signOut({ scope: "local" });
    PER_ACCOUNT_KEYS.forEach(removeStorage);
    clearPlan();
  },

  deleteAccount: () =>
    run(async () => {
      // delete_my_account (supabase/migrations) removes the signed-in user, and everything of theirs goes with it
      const { error } = await client().rpc("delete_my_account");
      if (error) {
        if (process.env.NODE_ENV === "development") console.error("delete_my_account failed", error.code, error.message);
        return fail("network");
      }
      // Every session ended with the account, so only this device's copy and its reminders are left to drop
      await cancelReminders();
      await client().auth.signOut({ scope: "local" });
      clearPlan();
      clearStackdStorage();
      return ok;
    }),
};
