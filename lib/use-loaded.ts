import { useEffect, useRef, useSyncExternalStore } from "react";

export type Loaded<T> = { status: "loading" } | { status: "error" } | { status: "ok"; data: T };

const LOADING = { status: "loading" } as const;
const ERROR = { status: "error" } as const;

// Every result this launch, shared by every screen: a key that loaded once shows at once and isn't read again
const results = new Map<string, Loaded<unknown>>();
const running = new Map<string, Promise<void>>();
const listeners = new Set<() => void>();

function set(key: string, result: Loaded<unknown>) {
  results.set(key, result);
  listeners.forEach((l) => l());
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

// Loads a key now, before a screen asks for it. Does nothing once it has loaded or while it's loading.
export function preload<T>(key: string, load: () => Promise<T>): Promise<void> {
  if (results.get(key)?.status === "ok") return Promise.resolve();
  const current = running.get(key);
  if (current) return current;
  const next = load()
    .then(
      (data) => set(key, { status: "ok", data }),
      () => set(key, ERROR),
    )
    .finally(() => running.delete(key));
  running.set(key, next);
  return next;
}

// Loads something from the database when its key becomes current. A null key loads nothing.
// Returns the result and a "Try again".
export function useLoaded<T>(key: string | null, load: () => Promise<T>): [Loaded<T>, () => void] {
  const loader = useRef(load);
  useEffect(() => {
    loader.current = load;
  });
  const result = useSyncExternalStore(subscribe, () => (key !== null && results.get(key)) || LOADING, () => LOADING);

  useEffect(() => {
    if (key !== null) preload(key, () => loader.current());
  }, [key]);

  function retry() {
    if (key === null) return;
    set(key, LOADING);
    preload(key, () => loader.current());
  }

  return [result as Loaded<T>, retry];
}
