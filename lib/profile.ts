import { readStorage } from "./storage";

// First name saved by Create account (07). Null after an Apple or Google sign-in, or if storage fails.
export function readFirstName(): string | null {
  try {
    const profile = JSON.parse(readStorage("stackd.profile") ?? "null");
    const name = typeof profile?.firstName === "string" ? profile.firstName.trim() : "";
    return name || null;
  } catch {
    return null;
  }
}
