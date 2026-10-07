// localStorage can throw (private browsing, blocked storage), so every read and write is guarded.
export function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeStorage(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {}
}

// Forgets everything Stackd keeps on this device, "Welcome seen" included (after an account is deleted)
export function clearStackdStorage() {
  for (const storage of [() => window.localStorage, () => window.sessionStorage]) {
    try {
      const store = storage();
      Object.keys(store)
        .filter((key) => key.startsWith("stackd."))
        .forEach((key) => store.removeItem(key));
    } catch {}
  }
}
