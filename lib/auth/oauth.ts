import { useEffect, useState } from "react";
import type { AuthError, OAuthProvider } from "./types";

// Apple and Google share everything below; only the provider name differs.
// The browser leaves for the provider and comes back to /auth/callback/, which finishes the sign-in (06 → Web sign-in return).

export const OAUTH_CALLBACK_PATH = "/auth/callback/";

// Where every sign-in that doesn't finish lands (06): cancelled, failed or expired, from Sign in or Create account
export const OAUTH_RETURN_PATH = "/sign-in/";

const PROVIDERS: readonly OAuthProvider[] = ["apple", "google"];

export const isOAuthProvider = (value: unknown): value is OAuthProvider => PROVIDERS.includes(value as OAuthProvider);

// Which provider a sign-in started with, kept for this tab only until it comes back
const PENDING_KEY = "stackd.oauthPending";

export function rememberOAuth(provider: OAuthProvider) {
  try {
    window.sessionStorage.setItem(PENDING_KEY, JSON.stringify({ provider }));
  } catch {}
}

export function takePendingOAuth(): OAuthProvider | null {
  let stored: { provider?: unknown } | null = null;
  try {
    stored = JSON.parse(window.sessionStorage.getItem(PENDING_KEY) ?? "null");
    window.sessionStorage.removeItem(PENDING_KEY);
  } catch {}
  return isOAuthProvider(stored?.provider) ? stored.provider : null;
}

export type CallbackError = "cancelled" | "expired" | "failed";
export type CallbackParams = { kind: "code"; code: string } | { kind: "error"; error: CallbackError } | { kind: "none" };

// Errors the student caused on purpose: Google's "Cancel" (access_denied) and Apple's (user_cancelled_authorize)
const CANCELLED = new Set(["access_denied", "user_cancelled_authorize", "user_cancelled_login"]);
// The sign-in took too long: Supabase's state for it ran out before the student came back
export const EXPIRED = new Set(["bad_oauth_state", "flow_state_expired"]);

function errorParams(url: URL) {
  const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
  const error = url.searchParams.get("error") ?? hash.get("error");
  const code = url.searchParams.get("error_code") ?? hash.get("error_code") ?? "";
  return { error, code };
}

// What the provider and Supabase sent back. Supabase puts errors in the query or the fragment, the PKCE code in the query.
export function readCallbackParams(href: string): CallbackParams {
  const url = new URL(href);
  const { error, code } = errorParams(url);
  if (error) {
    if (CANCELLED.has(error) || CANCELLED.has(code)) return { kind: "error", error: "cancelled" };
    return { kind: "error", error: EXPIRED.has(code) ? "expired" : "failed" };
  }
  const pkce = url.searchParams.get("code");
  return pkce ? { kind: "code", code: pkce } : { kind: "none" };
}

// A failed Apple or Google sign-in, carried in memory to Sign in (like lib/flash). The provider is unknown when this
// tab didn't start the sign-in.
let returned: { provider: OAuthProvider | null; error: AuthError } | null = null;

export function setReturnedOAuthError(provider: OAuthProvider | null, error: AuthError) {
  returned = { provider, error };
}

export function peekReturnedOAuthError() {
  return returned;
}

export function clearReturnedOAuthError() {
  returned = null;
}

// Supabase sends an expired sign-in to the Site URL (Home), not to /auth/callback/, because by then it no longer
// knows where the sign-in started. True when this page is that return: the error is kept for Sign in and the URL cleaned.
export function takeExpiredOAuthReturn(): boolean {
  const url = new URL(window.location.href);
  if (!EXPIRED.has(errorParams(url).code)) return false;
  setReturnedOAuthError(takePendingOAuth(), "oauth_expired");
  window.history.replaceState(null, "", url.pathname);
  return true;
}

// The pending social button, reset when Back from Apple's or Google's page restores this screen from the
// back-forward cache with its spinner still showing
export function usePendingOAuth<T extends string>() {
  const [pending, setPending] = useState<T | null>(null);
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) setPending(null);
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);
  return [pending, setPending] as const;
}
