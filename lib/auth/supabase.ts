import { isAuthApiError, isAuthRetryableFetchError, isAuthWeakPasswordError, type AuthError as SupabaseAuthError } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase/client";
import { removeStorage, writeStorage } from "@/lib/storage";
import type { Auth, AuthError, AuthResult } from "./types";

const ok: AuthResult = { ok: true };
const fail = (error: AuthError): AuthResult => ({ ok: false, error });

// Progress and the greeting cached on this device belong to whoever is signed in
const PER_ACCOUNT_KEYS = ["stackd.profile", "stackd.requirements", "stackd.saved", "stackd.progressOwner", "stackd.progressQueue"];

function toAuthError(error: SupabaseAuthError | Error): AuthError {
  if (isAuthRetryableFetchError(error) || !isAuthApiError(error)) return "network";
  if (isAuthWeakPasswordError(error)) return "weak_password";
  switch (error.code) {
    case "invalid_credentials":
      return "invalid_credentials";
    case "user_already_exists":
    case "email_exists":
      return "email_taken";
    case "otp_expired":
      return "invalid_code";
    case "same_password":
      return "weak_password";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "rate_limited";
    default:
      return "unknown";
  }
}

// Home's greeting reads stackd.profile, so the signed-in student's first name is cached there
function cacheFirstName(firstName: unknown) {
  if (typeof firstName === "string" && firstName.trim()) writeStorage("stackd.profile", JSON.stringify({ firstName: firstName.trim() }));
}

function client() {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase isn't configured: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return supabase;
}

async function run(fn: () => Promise<AuthResult>): Promise<AuthResult> {
  try {
    return await fn();
  } catch (e) {
    return fail(toAuthError(e as Error));
  }
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
      return data.session ? ok : { ok: true, needsCode: true };
    }),

  // Google and Sign in with Apple come with the iOS app (roadmap phase 6)
  signInWithOAuth: async () => fail("oauth_failed"),

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

  async signOut() {
    await getSupabase()?.auth.signOut();
    PER_ACCOUNT_KEYS.forEach(removeStorage);
  },
};
