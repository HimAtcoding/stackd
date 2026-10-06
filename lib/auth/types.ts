export type AuthError =
  | "invalid_credentials"
  | "email_taken"
  | "network"
  | "oauth_cancelled"
  | "oauth_failed"
  // A 6-digit code that's wrong or has expired (Supabase reports both the same way)
  | "invalid_code"
  | "rate_limited"
  // The new password is the one the account already has
  | "same_password"
  | "weak_password"
  // Signing in before the email is confirmed (only while Confirm email is on)
  | "email_not_confirmed";

export type AuthResult = { ok: true } | { ok: false; error: AuthError };
// needsCode: the account exists, but its email must be confirmed with a code first (Confirm email on)
export type SignUpResult = { ok: true; needsCode: boolean } | { ok: false; error: AuthError };
export type OAuthProvider = "apple" | "google";
// Enter code (09) serves two purposes: a password reset, or confirming a new account's email
export type CodePurpose = "reset" | "confirm";

// Sign in, create account, forgot password and enter code all use this, so the screens don't care what's behind it.
// Codes are 6 digits typed into the app, not email links, because links are fragile inside the iOS app.
// 09 names the code calls verifyCode / resendCode / updatePassword; these are the same calls, split by purpose.
export interface Auth {
  signInWithPassword(email: string, password: string): Promise<AuthResult>;
  signUp(firstName: string, email: string, password: string): Promise<SignUpResult>;
  signInWithOAuth(provider: OAuthProvider): Promise<AuthResult>;
  // Emails a 6-digit reset code. Also the reset code's "Send a new code"
  sendPasswordReset(email: string): Promise<AuthResult>;
  // The code from the reset email. On success the student is signed in and can set a new password.
  verifyResetCode(email: string, code: string): Promise<AuthResult>;
  setNewPassword(password: string): Promise<AuthResult>;
  // The code from the confirm-your-email message, and sending a new one
  verifySignUpCode(email: string, code: string): Promise<AuthResult>;
  resendSignUpCode(email: string): Promise<AuthResult>;
  signOut(): Promise<void>;
}
