// Run by scripts/test-reminders.mts in its own process, once with the flags off and once on: pretends to be the
// iPhone app, signs out, and reports how many times the Local Notifications plugin was loaded.
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

const { cancelReminders } = await import("../lib/reminders/native");
// Without iOS behind it the plugin call never answers, so the sign-out is given a moment, not awaited
await Promise.race([cancelReminders(), new Promise((resolve) => setTimeout(resolve, 300))]);
console.log(JSON.stringify({ loads }));
process.exit(0);
