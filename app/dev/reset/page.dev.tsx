"use client";

import { useEffect } from "react";

function clearStackdKeys(storage: Storage) {
  try {
    Object.keys(storage)
      .filter((key) => key.startsWith("stackd."))
      .forEach((key) => storage.removeItem(key));
  } catch {}
}

// Dev only: forgets everything Stackd saved on this device, then reloads Welcome as a first launch.
export default function ResetPage() {
  useEffect(() => {
    clearStackdKeys(window.localStorage);
    clearStackdKeys(window.sessionStorage);
    // A full load, so the in-memory email and any stale dev CSS go too
    window.location.replace("/welcome");
  }, []);

  return <p className="p-6 text-navy-900 type-body">Clearing saved data…</p>;
}
