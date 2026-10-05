import { endSession, startDemoSession } from "@/lib/session";
import { writeStorage } from "@/lib/storage";
import type { Auth, AuthError, AuthResult } from "./types";

// Stands in for real accounts in the demo. Emails and passwords are never stored.
const DELAY_MS = 600;
const OFFLINE_EMAIL = "offline@example.com";
const TAKEN_EMAIL = "taken@example.com";

const wait = () => new Promise((resolve) => setTimeout(resolve, DELAY_MS));
const ok: AuthResult = { ok: true };
const fail = (error: AuthError): AuthResult => ({ ok: false, error });
const same = (a: string, b: string) => a.trim().toLowerCase() === b;
// Any 6 digits pass, except 000000, which stands in for a wrong or expired code
const codeResult = (code: string) => (/^\d{6}$/.test(code.trim()) && code.trim() !== "000000" ? ok : fail("invalid_code"));

export const demoAuth: Auth = {
  async signInWithPassword(email, password) {
    await wait();
    if (same(email, OFFLINE_EMAIL)) return fail("network");
    if (password === "wrong") return fail("invalid_credentials");
    startDemoSession();
    return ok;
  },

  async signUp(firstName, email) {
    await wait();
    if (same(email, OFFLINE_EMAIL)) return fail("network");
    if (same(email, TAKEN_EMAIL)) return fail("email_taken");
    startDemoSession();
    writeStorage("stackd.profile", JSON.stringify({ firstName }));
    return ok;
  },

  async signInWithOAuth() {
    await wait();
    startDemoSession();
    return ok;
  },

  async sendPasswordReset(email) {
    await wait();
    if (same(email, OFFLINE_EMAIL)) return fail("network");
    return ok;
  },

  async verifyResetCode(_email, code) {
    await wait();
    const result = codeResult(code);
    if (result.ok) startDemoSession();
    return result;
  },

  async setNewPassword() {
    await wait();
    return ok;
  },

  async verifySignUpCode(_email, code) {
    await wait();
    const result = codeResult(code);
    if (result.ok) startDemoSession();
    return result;
  },

  async resendSignUpCode() {
    await wait();
    return ok;
  },

  async signOut() {
    endSession();
  },
};
