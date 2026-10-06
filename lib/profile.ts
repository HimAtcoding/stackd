import { readStorage } from "./storage";
import { AUTH_STORAGE_KEY } from "./supabase/client";

function parse(key: string): unknown {
  try {
    return JSON.parse(readStorage(key) ?? "null");
  } catch {
    return null;
  }
}

const clean = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : null);

// The signed-in student's first name: the copy saved at sign-in or Create account (07), or else the one in the
// Supabase session on this device (sign-up metadata), so every way of signing in greets them by name.
// Null when neither has one, e.g. after an Apple or Google sign-in.
export function readFirstName(): string | null {
  const profile = parse("stackd.profile") as { firstName?: unknown } | null;
  const session = parse(AUTH_STORAGE_KEY) as { user?: { user_metadata?: { first_name?: unknown } } } | null;
  return clean(profile?.firstName) ?? clean(session?.user?.user_metadata?.first_name);
}
