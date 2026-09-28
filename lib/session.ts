import { readStorage, removeStorage, writeStorage } from "./storage";

const SESSION_KEY = "stackd.session";
const SEEN_WELCOME_KEY = "stackd.seenWelcome";

export function hasSession() {
  return readStorage(SESSION_KEY) === "demo";
}

export function startDemoSession() {
  writeStorage(SESSION_KEY, "demo");
}

// Signing out keeps stackd.seenWelcome, so the student lands on Sign in, not Welcome.
export function endSession() {
  removeStorage(SESSION_KEY);
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

// Storage never changes during a render, so a no-op subscribe is enough for useSyncExternalStore.
export function subscribeNoop() {
  return () => {};
}
