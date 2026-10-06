import { endSession, startDemoSession } from "@/lib/session";
import { writeStorage } from "@/lib/storage";
import type { Auth, AuthError, AuthResult } from "./types";

// Stands in for real accounts in the demo. Emails and passwords are never stored.
// Special emails and codes trigger each result, so every screen state can be reached (06 and 09 → Demo implementation).
const DELAY_MS = 600;
const OFFLINE_EMAIL = "offline@example.com";
const TAKEN_EMAIL = "taken@example.com";
const LIMITED_EMAIL = "limited@example.com";
const CONFIRM_EMAIL = "confirm@example.com";
const UNCONFIRMED_EMAIL = "unconfirmed@example.com";
const WRONG_CODE = "000000";
const LIMITED_CODE = "999999";
const SAME_PASSWORD = "samepassword";

const wait = () => new Promise((resolve) => setTimeout(resolve, DELAY_MS));
const ok: AuthResult = { ok: true };
const fail = (error: AuthError) => ({ ok: false as const, error });
const same = (a: string, b: string) => a.trim().toLowerCase() === b;

// offline@ and limited@ behave the same on every call that takes an email
function emailFailure(email: string) {
  if (same(email, OFFLINE_EMAIL)) return fail("network");
  if (same(email, LIMITED_EMAIL)) return fail("rate_limited");
  return null;
}

async function checkCode(email: string, code: string): Promise<AuthResult> {
  await wait();
  if (same(email, OFFLINE_EMAIL)) return fail("network");
  if (code === WRONG_CODE) return fail("invalid_code");
  if (code === LIMITED_CODE) return fail("rate_limited");
  if (!/^\d{6}$/.test(code)) return fail("invalid_code");
  startDemoSession();
  return ok;
}

export const demoAuth: Auth = {
  async signInWithPassword(email, password) {
    await wait();
    const failure = emailFailure(email);
    if (failure) return failure;
    if (same(email, UNCONFIRMED_EMAIL)) return fail("email_not_confirmed");
    if (password === "wrong") return fail("invalid_credentials");
    startDemoSession();
    return ok;
  },

  async signUp(firstName, email) {
    await wait();
    const failure = emailFailure(email);
    if (failure) return failure;
    if (same(email, TAKEN_EMAIL)) return fail("email_taken");
    writeStorage("stackd.profile", JSON.stringify({ firstName }));
    // confirm@ stands in for Confirm email being on: no session until the code is checked
    if (same(email, CONFIRM_EMAIL)) return { ok: true, needsCode: true };
    startDemoSession();
    return { ok: true, needsCode: false };
  },

  async signInWithOAuth() {
    await wait();
    startDemoSession();
    return ok;
  },

  async sendPasswordReset(email) {
    await wait();
    return emailFailure(email) ?? ok;
  },

  verifyResetCode: checkCode,

  async setNewPassword(password) {
    await wait();
    return password === SAME_PASSWORD ? fail("same_password") : ok;
  },

  verifySignUpCode: checkCode,

  async resendSignUpCode(email) {
    await wait();
    return emailFailure(email) ?? ok;
  },

  async signOut() {
    endSession();
  },
};
