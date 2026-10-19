// Run by scripts/test-reminders.mts in its own process, once as the release and once with the reminders flag forced
// off (STACKD_REMINDERS_OFF=1): pretends to be the iPhone app, signs out, and reports how many times the Local
// Notifications plugin was loaded.
import * as nodeModule from "node:module";

// Node 24 has registerHooks; this project's @types/node doesn't list it yet
type Resolve = (specifier: string, context: unknown, next: (specifier: string, context: unknown) => unknown) => unknown;
const { registerHooks } = nodeModule as unknown as { registerHooks: (hooks: { resolve: Resolve }) => void };

let loads = 0;
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "@capacitor/local-notifications") loads++;
    return next(specifier, context);
  },
});

// Capacitor reads the platform from the iOS bridge the app injects
const g = globalThis as Record<string, unknown>;
g.window = globalThis;
g.webkit = { messageHandlers: { bridge: { postMessage() {} } } };

// Forced off: the same FEATURES object native.ts reads at sign-out, with reminders set to false
const { FEATURES } = await import("../lib/features");
if (process.env.STACKD_REMINDERS_OFF === "1") (FEATURES as { reminders: boolean }).reminders = false;

const { cancelReminders } = await import("../lib/reminders/native");
// Without iOS behind it the plugin call never answers, so the sign-out is given a moment, not awaited
await Promise.race([cancelReminders(), new Promise((resolve) => setTimeout(resolve, 300))]);
console.log(JSON.stringify({ loads, reminders: FEATURES.reminders }));
process.exit(0);
