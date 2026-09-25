export type AuthError = "invalid_credentials" | "email_taken" | "network" | "oauth_cancelled" | "oauth_failed";
export type AuthResult = { ok: true } | { ok: false; error: AuthError };
export type OAuthProvider = "apple" | "google";

// Sign in, create account and forgot password all use this, so the screens don't care what's behind it.
export interface Auth {
  signInWithPassword(email: string, password: string): Promise<AuthResult>;
  signUp(firstName: string, email: string, password: string): Promise<AuthResult>;
  signInWithOAuth(provider: OAuthProvider): Promise<AuthResult>;
  sendPasswordReset(email: string): Promise<AuthResult>;
}
