// Checks how /auth/callback/ reads what Apple, Google and Supabase send back, and that a sign-in that doesn't finish
// can only ever land on Sign in. Calls no provider and touches no database: `npm run test:oauth`
import { createHash } from "node:crypto";
import { createNonce, isNativeCallback, NATIVE_CALLBACK_URL } from "../lib/auth/native.ts";
import {
  OAUTH_CALLBACK_PATH,
  OAUTH_RETURN_PATH,
  peekReturnedOAuthError,
  readCallbackParams,
  rememberOAuth,
  takeExpiredOAuthReturn,
  takePendingOAuth,
} from "../lib/auth/oauth.ts";

let failed = 0;
function expect(name, actual, wanted) {
  const ok = JSON.stringify(actual) === JSON.stringify(wanted);
  if (!ok) failed++;
  console.log(ok ? "ok   " : "FAIL ", name, ok ? "" : `- got ${JSON.stringify(actual)}, wanted ${JSON.stringify(wanted)}`);
}

// sessionStorage, location and history as the browser has them
const store = new Map();
const replaced = [];
globalThis.window = {
  sessionStorage: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  },
  location: { href: "http://localhost:3000/" },
  history: { replaceState: (_s, _t, url) => replaced.push(url) },
};

const at = (rest) => `http://localhost:3000${OAUTH_CALLBACK_PATH}${rest}`;

expect("PKCE code in the query", readCallbackParams(at("?code=abc-123")), { kind: "code", code: "abc-123" });
expect("no code, no error", readCallbackParams(at("")), { kind: "none" });
expect("Google cancel (access_denied)", readCallbackParams(at("?error=access_denied&error_description=x")), { kind: "error", error: "cancelled" });
expect("Apple cancel (user_cancelled_authorize)", readCallbackParams(at("?error=invalid_request&error_code=user_cancelled_authorize")), { kind: "error", error: "cancelled" });
expect("error in the fragment", readCallbackParams(at("#error=access_denied")), { kind: "error", error: "cancelled" });
expect("provider failure", readCallbackParams(at("?error=server_error&error_code=unexpected_failure")), { kind: "error", error: "failed" });
expect("an error wins over a code", readCallbackParams(at("?code=abc&error=server_error")), { kind: "error", error: "failed" });
expect("an expired sign-in (bad_oauth_state)", readCallbackParams(at("?error=invalid_request&error_code=bad_oauth_state")), { kind: "error", error: "expired" });

expect("every unfinished sign-in lands on Sign in", OAUTH_RETURN_PATH, "/sign-in/");

rememberOAuth("apple");
expect("pending sign-in is read back", takePendingOAuth(), "apple");
expect("and read only once", takePendingOAuth(), null);

// Anything tampered with in storage is ignored
store.set("stackd.oauthPending", JSON.stringify({ provider: "github" }));
expect("an unknown provider is refused", takePendingOAuth(), null);
store.set("stackd.oauthPending", "{not json");
expect("broken storage is ignored", takePendingOAuth(), null);

// The expired return lands on the Site URL (Home), not the callback
expect("a plain Home visit isn't an expired return", takeExpiredOAuthReturn(), false);
rememberOAuth("google");
window.location.href = "http://localhost:3000/?error=invalid_request&error_code=bad_oauth_state&error_description=OAuth+state+has+expired";
expect("Home with bad_oauth_state is an expired return", takeExpiredOAuthReturn(), true);
expect("its message waits for Sign in, with the provider", peekReturnedOAuthError(), { provider: "google", error: "oauth_expired" });
expect("and the URL is cleaned", replaced.at(-1), "/");
window.location.href = "http://localhost:3000/#error=invalid_request&error_code=bad_oauth_state";
expect("the same in the fragment", takeExpiredOAuthReturn(), true);

// The iOS app: Google's in-app browser returns to the app's own scheme, and Apple's sheet needs a nonce
const native = (rest) => `${NATIVE_CALLBACK_URL}${rest}`;
expect("the app's callback URL", NATIVE_CALLBACK_URL, "app.stackd.transfer://auth/callback/");
expect("the app's callback is recognised", isNativeCallback(native("?code=abc")), true);
expect("also without the trailing slash", isNativeCallback("app.stackd.transfer://auth/callback?code=abc"), true);
expect("another path in the app is ignored", isNativeCallback("app.stackd.transfer://settings/?code=abc"), false);
expect("a lookalike scheme is ignored", isNativeCallback("app.stackd.transfer.evil://auth/callback/?code=abc"), false);
expect("the web callback isn't the app's", isNativeCallback(at("?code=abc")), false);
expect("garbage is ignored", isNativeCallback("not a url"), false);
expect("PKCE code from the app's callback", readCallbackParams(native("?code=abc-123")), { kind: "code", code: "abc-123" });
expect("Google cancel through the app's callback", readCallbackParams(native("?error=access_denied")), { kind: "error", error: "cancelled" });
expect("expiry through the app's callback", readCallbackParams(native("?error=invalid_request&error_code=flow_state_expired")), { kind: "error", error: "expired" });

const nonce = await createNonce();
expect("the nonce is 64 hex characters", /^[0-9a-f]{64}$/.test(nonce.raw), true);
expect("Apple gets its SHA-256", nonce.hashed, createHash("sha256").update(nonce.raw).digest("hex"));
expect("every nonce is new", (await createNonce()).raw === nonce.raw, false);

console.log(failed ? `\n${failed} failed` : "\nAll OAuth callback checks passed");
process.exit(failed ? 1 : 0);
