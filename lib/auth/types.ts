export type AuthError =
  | "invalid_credentials"
  | "email_taken"
  | "network"
  | "oauth_cancelled"
  | "oauth_failed"
  // A 6-digit code that's wrong or has expired
  | "invalid_code"
  | "weak_password"
  | "rate_limited"
  // Anything the screens have no specific copy for
  | "unknown";

// needsCode: the account exists but its email must be confirmed with a code first (when Confirm email is on)
export type AuthResult = { ok: true; needsCode?: boolean } | { ok: false; error: AuthError };
export type OAuthProvider = "apple" | "google";

// Sign in, create account and forgot password all use this, so the screens don't care what's behind it.
// Email confirmation and password reset use 6-digit codes typed into the app, not email links,
// because links are fragile inside the iOS app.
export interface Auth {
  signInWithPassword(email: string, password: string): Promise<AuthResult>;
  signUp(firstName: string, email: string, password: string): Promise<AuthResult>;
  signInWithOAuth(provider: OAuthProvider): Promise<AuthResult>;
  // Emails a 6-digit reset code
  sendPasswordReset(email: string): Promise<AuthResult>;
  // The code from the reset email. On success the student is signed in and can set a new password.
  verifyResetCode(email: string, code: string): Promise<AuthResult>;
  setNewPassword(password: string): Promise<AuthResult>;
  // The code from the confirm-your-email message, when Confirm email is on
  verifySignUpCode(email: string, code: string): Promise<AuthResult>;
  resendSignUpCode(email: string): Promise<AuthResult>;
  signOut(): Promise<void>;
}
