import { useEffect, useRef, useState } from "react";

export type Loaded<T> = { status: "loading" } | { status: "error" } | { status: "ok"; data: T };

const LOADING = { status: "loading" } as const;

// Loads something from the database each time its key becomes current (10: lists load when each step opens).
// A result that loaded before shows at once while it's read again. A null key loads nothing.
// Returns the result and a "Try again".
export function useLoaded<T>(key: string | null, load: () => Promise<T>): [Loaded<T>, () => void] {
  const [results, setResults] = useState<Record<string, Loaded<T>>>({});
  const [attempt, setAttempt] = useState(0);
  const loader = useRef(load);
  useEffect(() => {
    loader.current = load;
  });

  useEffect(() => {
    if (key === null) return;
    let stale = false;
    loader.current().then(
      (data) => !stale && setResults((prev) => ({ ...prev, [key]: { status: "ok", data } })),
      () => !stale && setResults((prev) => (prev[key]?.status === "ok" ? prev : { ...prev, [key]: { status: "error" } })),
    );
    return () => {
      stale = true;
    };
  }, [key, attempt]);

  function retry() {
    if (key === null) return;
    setResults((prev) => ({ ...prev, [key]: LOADING }));
    setAttempt((n) => n + 1);
  }

  return [(key !== null && results[key]) || LOADING, retry];
}
