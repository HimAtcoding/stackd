import { useEffect, useState } from "react";
import type { AuthError, OAuthProvider } from "./types";

// Apple and Google share everything below; only the provider name differs.
// The browser leaves for the provider and comes back to /auth/callback/, which finishes the sign-in.

export const OAUTH_CALLBACK_PATH = "/auth/callback/";

// The screen a sign-in started from, so a cancelled or failed one returns there (06, 07)
export type OAuthOrigin = "sign-in" | "sign-up";

const ORIGIN_PATH: Record<OAuthOrigin, string> = { "sign-in": "/sign-in/", "sign-up": "/sign-up/" };
const PROVIDERS: readonly OAuthProvider[] = ["apple", "google"];

// Only ever one of these two paths, so nothing in a URL can choose where the student lands
export const originPath = (origin: OAuthOrigin) => ORIGIN_PATH[origin];

export const isOAuthProvider = (value: unknown): value is OAuthProvider => PROVIDERS.includes(value as OAuthProvider);

// Which provider and screen a sign-in started from, kept for this tab only until the callback reads it
const PENDING_KEY = "stackd.oauthPending";

export function rememberOAuth(provider: OAuthProvider, origin: OAuthOrigin) {
  try {
    window.sessionStorage.setItem(PENDING_KEY, JSON.stringify({ provider, origin }));
  } catch {}
}

export function takePendingOAuth(): { provider: OAuthProvider | null; origin: OAuthOrigin } {
  let stored: { provider?: unknown; origin?: unknown } | null = null;
  try {
    stored = JSON.parse(window.sessionStorage.getItem(PENDING_KEY) ?? "null");
    window.sessionStorage.removeItem(PENDING_KEY);
  } catch {}
  return {
    provider: isOAuthProvider(stored?.provider) ? stored.provider : null,
    origin: stored?.origin === "sign-up" ? "sign-up" : "sign-in",
  };
}

export type CallbackParams = { kind: "code"; code: string } | { kind: "error"; cancelled: boolean } | { kind: "none" };

// Errors the student caused on purpose: Google's "Cancel" (access_denied) and Apple's (user_cancelled_authorize)
const CANCELLED = new Set(["access_denied", "user_cancelled_authorize", "user_cancelled_login"]);

// What the provider and Supabase sent back. Supabase puts errors in the query or the fragment, the PKCE code in the query.
export function readCallbackParams(href: string): CallbackParams {
  const url = new URL(href);
  const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
  const error = url.searchParams.get("error") ?? hash.get("error");
  if (error) {
    const code = url.searchParams.get("error_code") ?? hash.get("error_code") ?? "";
    return { kind: "error", cancelled: CANCELLED.has(error) || CANCELLED.has(code) };
  }
  const code = url.searchParams.get("code");
  return code ? { kind: "code", code } : { kind: "none" };
}

// A failed Apple or Google sign-in, carried in memory to the screen the student returns to (like lib/flash)
let returned: { provider: OAuthProvider; error: AuthError } | null = null;

export function setReturnedOAuthError(provider: OAuthProvider, error: AuthError) {
  returned = { provider, error };
}

export function peekReturnedOAuthError() {
  return returned;
}

export function clearReturnedOAuthError() {
  returned = null;
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
