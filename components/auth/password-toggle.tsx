"use client";

import type { RefObject } from "react";
import { flushSync } from "react-dom";
import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react/ssr";

type PasswordToggleProps = {
  inputRef: RefObject<HTMLInputElement | null>;
  shown: boolean;
  setShown: (shown: boolean) => void;
};

// Show/hide button inside the password field. Keeps focus and the caret in the field.
export function PasswordToggle({ inputRef, shown, setShown }: PasswordToggleProps) {
  function toggle() {
    const input = inputRef.current;
    const focused = input !== null && document.activeElement === input;
    const start = input?.selectionStart ?? null;
    const end = input?.selectionEnd ?? null;
    flushSync(() => setShown(!shown));
    if (input && focused) {
      input.focus();
      input.setSelectionRange(start, end);
      // Chromium moves the caret again after a mouse click on the type change, so restore it once more.
      requestAnimationFrame(() => input.setSelectionRange(start, end));
    }
  }

  return (
    <button
      type="button"
      aria-label={shown ? "Hide password" : "Show password"}
      aria-pressed={shown}
      onMouseDown={(e) => {
        if (document.activeElement === inputRef.current) e.preventDefault();
      }}
      onClick={toggle}
      className="flex size-11 items-center justify-center rounded-sm text-slate-600"
    >
      {shown ? <EyeSlashIcon size={22} aria-hidden /> : <EyeIcon size={22} aria-hidden />}
    </button>
  );
}
