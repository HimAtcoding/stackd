import { useSyncExternalStore } from "react";
import { readSessionUser } from "@/lib/profile";
import { readStorage, writeStorage } from "@/lib/storage";

const owner = () => readSessionUser()?.id ?? "demo";

// A per-account value on this device, tagged with the account so another student never sees it.
// Kept in memory when storage is blocked, so it still works until the tab closes.
export function accountStore<T>(key: string, empty: T) {
  const listeners = new Set<() => void>();
  let memory: string | null = null;
  let cache: { raw: string | null; owner: string; value: T } | null = null;

  function get(): T {
    const raw = readStorage(key) ?? memory;
    const who = owner();
    if (cache && cache.raw === raw && cache.owner === who) return cache.value;
    let value = empty;
    try {
      const stored = JSON.parse(raw ?? "null") as { userId?: string; value?: T } | null;
      if (stored?.userId === who && stored.value !== undefined) value = stored.value;
    } catch {}
    cache = { raw, owner: who, value };
    return value;
  }

  function set(update: (prev: T) => T) {
    const raw = JSON.stringify({ userId: owner(), value: update(get()) });
    memory = writeStorage(key, raw) ? null : raw;
    listeners.forEach((l) => l());
  }

  function subscribe(onChange: () => void) {
    listeners.add(onChange);
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === key) onChange();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(onChange);
      window.removeEventListener("storage", onStorage);
    };
  }

  return { get, set, subscribe, use: () => useSyncExternalStore(subscribe, get, () => empty) };
}
