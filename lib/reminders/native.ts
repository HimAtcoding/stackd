import type { LocalNotificationsPlugin, PermissionStatus } from "@capacitor/local-notifications";
import { isNativeApp } from "@/lib/capacitor";
import { FEATURES } from "@/lib/features";
import { cancelAll, serialized } from "./schedule";

// The Capacitor Local Notifications plugin, loaded only in the iPhone app

// prompt: iOS hasn't asked yet, so its own prompt can still appear (once). unsupported: the web app.
export type Permission = "granted" | "denied" | "prompt" | "unsupported";

let pluginModule: Promise<{ LocalNotifications: LocalNotificationsPlugin }> | null = null;

// Runs `task` with the plugin. The plugin is never passed through a promise: a Capacitor plugin answers every
// property, `then` included, so a promise resolved with it would never settle. `task` mustn't return it either.
export async function withNotifications<T>(task: (api: LocalNotificationsPlugin) => Promise<T>): Promise<T> {
  const { LocalNotifications } = await (pluginModule ??= import("@capacitor/local-notifications"));
  return task(LocalNotifications);
}

const exclusive = serialized();

// Scheduling and cancelling, one at a time (lib/reminders/sync.ts and sign-out share this)
export const withNotificationsExclusive = <T>(task: (api: LocalNotificationsPlugin) => Promise<T>): Promise<T> =>
  exclusive(() => withNotifications(task));

const toPermission = ({ display }: PermissionStatus): Permission => (display === "granted" ? "granted" : display === "denied" ? "denied" : "prompt");

export async function checkPermission(): Promise<Permission> {
  if (!isNativeApp()) return "unsupported";
  try {
    return toPermission(await withNotifications((api) => api.checkPermissions()));
  } catch {
    return "unsupported";
  }
}

// Shows iOS's own prompt when it hasn't been asked; afterwards it answers with the saved choice
export async function requestPermission(): Promise<Permission> {
  if (!isNativeApp()) return "unsupported";
  try {
    return toPermission(await withNotifications((api) => api.requestPermissions()));
  } catch {
    return "denied";
  }
}

// Signing out or deleting the account: no reminder stays scheduled. Never throws, so sign-out always finishes.
// With the reminders flag off (the v1 release) the plugin is never loaded, since nothing could have been scheduled.
export async function cancelReminders(): Promise<void> {
  if (!FEATURES.reminders || !isNativeApp()) return;
  try {
    await withNotificationsExclusive((api) => cancelAll(api));
  } catch {}
}
