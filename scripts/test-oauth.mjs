// Checks how /auth/callback/ reads what Apple, Google and Supabase send back, and that a sign-in can only ever
// return to Sign in or Create account. Calls no provider and touches no database: `npm run test:oauth`
import {
  OAUTH_CALLBACK_PATH,
  originPath,
  readCallbackParams,
  rememberOAuth,
  takePendingOAuth,
} from "../lib/auth/oauth.ts";

let failed = 0;
function expect(name, actual, wanted) {
  const ok = JSON.stringify(actual) === JSON.stringify(wanted);
  if (!ok) failed++;
  console.log(ok ? "ok   " : "FAIL ", name, ok ? "" : `- got ${JSON.stringify(actual)}, wanted ${JSON.stringify(wanted)}`);
}

// sessionStorage as the browser has it
const store = new Map();
globalThis.window = {
  sessionStorage: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  },
};

const at = (rest) => `http://localhost:3000${OAUTH_CALLBACK_PATH}${rest}`;

expect("PKCE code in the query", readCallbackParams(at("?code=abc-123")), { kind: "code", code: "abc-123" });
expect("no code, no error", readCallbackParams(at("")), { kind: "none" });
expect("Google cancel (access_denied)", readCallbackParams(at("?error=access_denied&error_description=x")), { kind: "error", cancelled: true });
expect("Apple cancel (user_cancelled_authorize)", readCallbackParams(at("?error=invalid_request&error_code=user_cancelled_authorize")), { kind: "error", cancelled: true });
expect("error in the fragment", readCallbackParams(at("#error=access_denied")), { kind: "error", cancelled: true });
expect("provider failure", readCallbackParams(at("?error=server_error&error_code=unexpected_failure")), { kind: "error", cancelled: false });
expect("an error wins over a code", readCallbackParams(at("?code=abc&error=server_error")), { kind: "error", cancelled: false });

expect("Sign in returns to Sign in", originPath("sign-in"), "/sign-in/");
expect("Create account returns to Create account", originPath("sign-up"), "/sign-up/");

rememberOAuth("apple", "sign-up");
expect("pending sign-in is read back", takePendingOAuth(), { provider: "apple", origin: "sign-up" });
expect("and read only once", takePendingOAuth(), { provider: null, origin: "sign-in" });

// Anything tampered with in storage falls back to Sign in, never to a URL
store.set("stackd.oauthPending", JSON.stringify({ provider: "github", origin: "https://evil.example" }));
expect("unknown provider and origin are refused", takePendingOAuth(), { provider: null, origin: "sign-in" });
store.set("stackd.oauthPending", "{not json");
expect("broken storage is ignored", takePendingOAuth(), { provider: null, origin: "sign-in" });

console.log(failed ? `\n${failed} failed` : "\nAll OAuth callback checks passed");
process.exit(failed ? 1 : 0);
