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
