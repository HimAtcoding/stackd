"use client";

import { useEffect, useRef, useState } from "react";

type ToastProps = {
  message: string;
  action?: { label: string; onClick: () => void };
  // Distance from the bottom edge: 12 above the tab bar or the primary button.
  bottom: string;
  // Placed against its positioned parent, not the screen (Welcome, where the button isn't at a fixed height)
  within?: boolean;
  onDone: () => void;
  // Static specimen for /dev/components: no timer, no fixed positioning.
  still?: boolean;
};

const VISIBLE_MS = 4000;
const EXIT_MS = 160;

export function Toast({ message, action, bottom, within, onDone, still }: ToastProps) {
  const [leaving, setLeaving] = useState(false);
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });

  useEffect(() => {
    if (still) return;
    const hide = setTimeout(() => setLeaving(true), VISIBLE_MS);
    const remove = setTimeout(() => done.current(), VISIBLE_MS + EXIT_MS);
    return () => {
      clearTimeout(hide);
      clearTimeout(remove);
    };
  }, [still]);

  return (
    <div
      role="status"
      className={
        still
          ? "flex items-center gap-4 rounded-md bg-navy-900 px-4 py-3"
          : `${within ? "absolute inset-x-0" : "fixed inset-x-4"} z-40 mx-auto flex max-w-[448px] items-center gap-4 rounded-md bg-navy-900 px-4 py-3 text-left ${leaving ? "toast-out" : "toast-in"}`
      }
      style={still ? undefined : { bottom }}
    >
      <p className="flex-1 text-white type-body font-medium">{message}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="-my-3 py-3 text-[#9CC6FF] type-link pressed:underline focus-ring:underline"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
