import { DEMO_MODE } from "./flags";
import { readStorage, removeStorage, writeStorage } from "./storage";
import { AUTH_STORAGE_KEY, getSupabase } from "./supabase/client";

const SESSION_KEY = "stackd.session";
const SEEN_WELCOME_KEY = "stackd.seenWelcome";
const SESSION_EVENT = "stackd:session";

// Demo mode: stackd.session. Otherwise: the session supabase-js keeps (and refreshes) under AUTH_STORAGE_KEY.
export function hasSession() {
  return DEMO_MODE ? readStorage(SESSION_KEY) === "demo" : readStorage(AUTH_STORAGE_KEY) !== null;
}

// Fires when the session starts or ends, in this tab or another, including when Supabase can't refresh it.
export function subscribeSession(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(SESSION_EVENT, onChange);
  const sub = DEMO_MODE ? null : getSupabase()?.auth.onAuthStateChange(() => onChange());
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(SESSION_EVENT, onChange);
    sub?.data.subscription.unsubscribe();
  };
}

export function startDemoSession() {
  writeStorage(SESSION_KEY, "demo");
  window.dispatchEvent(new Event(SESSION_EVENT));
}

// Signing out keeps stackd.seenWelcome, so the student lands on Sign in, not Welcome.
export function endSession() {
  removeStorage(SESSION_KEY);
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function hasSeenWelcome() {
  return readStorage(SEEN_WELCOME_KEY) === "1";
}

export function markWelcomeSeen() {
  writeStorage(SEEN_WELCOME_KEY, "1");
}

// Where a signed-out student lands: Welcome once, then Sign in.
export function signedOutRoute() {
  return hasSeenWelcome() ? "/sign-in" : "/welcome";
}

// For values that never change during a render.
export function subscribeNoop() {
  return () => {};
}
