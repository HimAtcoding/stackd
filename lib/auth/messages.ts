import { peekReturnedOAuthError } from "./oauth";
import type { AuthError, OAuthProvider } from "./types";

// Field checks and error copy shared by the three auth screens (flows-and-states → Field validation).

export function emailError(input: HTMLInputElement) {
  if (!input.value.trim()) return "Enter your email.";
  if (input.validity.typeMismatch) return "Enter an email like name@example.com.";
  return undefined;
}

export type ErrorCopy = { title: string; body: string };

const PROVIDER_NAME: Record<OAuthProvider, string> = { apple: "Apple", google: "Google" };

export const NETWORK_ERROR: ErrorCopy = { title: "Couldn't reach Stackd", body: "Check your connection, then try again." };

// Copy for a failed Apple or Google sign-in. Cancelling on purpose shows nothing.
export function oauthErrorCopy(error: AuthError, provider: OAuthProvider): ErrorCopy | null {
  if (error === "oauth_cancelled") return null;
  if (error === "network") return NETWORK_ERROR;
  return { title: `Couldn't sign in with ${PROVIDER_NAME[provider]}`, body: "Try again, or sign in with your email." };
}

// An Apple or Google sign-in that failed after leaving the app, shown once on the screen it returned to
export function returnedOAuthCopy(): ErrorCopy | null {
  const returned = peekReturnedOAuthError();
  return returned ? oauthErrorCopy(returned.error, returned.provider) : null;
}

export const RATE_LIMITED: ErrorCopy = { title: "Too many tries", body: "Wait a few minutes, then try again." };

// Sign in before the email is confirmed (06); the screen adds a "Send code" button
export const emailNotConfirmed = (email: string): ErrorCopy => ({ title: "Confirm your email first", body: `We'll send a code to ${email.trim()}.` });

// Field errors for the code and new password steps (09)
export const CODE_INCOMPLETE = "Enter all 6 digits.";
export const CODE_INVALID = "That code didn't work. Check the email, or send a new code.";
export const SAME_PASSWORD = "That's your current password. Pick a new one.";
export const WEAK_PASSWORD = "Pick a password that's harder to guess.";

// The inline error for an auth result that isn't a field error: too many tries, or anything else as a connection problem
export const inlineErrorCopy = (error: AuthError): ErrorCopy => (error === "rate_limited" ? RATE_LIMITED : NETWORK_ERROR);
