// Pieces of the iOS app's sign-in that don't need the native bridge, so `npm run test:oauth` can check them.

// The app's one URL scheme (Info.plist → CFBundleURLTypes): the bundle ID, so no other app claims it.
export const NATIVE_SCHEME = "app.stackd.transfer";

// Where Supabase sends the in-app browser back after Google, in place of the web's /auth/callback/.
// It must be in Supabase → Authentication → URL Configuration → Redirect URLs.
export const NATIVE_CALLBACK_URL = `${NATIVE_SCHEME}://auth/callback/`;

// True for the sign-in return only. Anything else opening the app (another path, a lookalike scheme) is ignored.
export function isNativeCallback(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === `${NATIVE_SCHEME}:` && parsed.host === "auth" && parsed.pathname.replace(/\/$/, "") === "/callback";
  } catch {
    return false;
  }
}

const hex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

// Sign in with Apple's nonce: Apple gets the SHA-256 hash and puts it in the identity token, and Supabase gets the raw
// value and checks the two match, so a token can't be replayed into another sign-in.
export async function createNonce() {
  const raw = hex(crypto.getRandomValues(new Uint8Array(32)));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  return { raw, hashed: hex(new Uint8Array(digest)) };
}
