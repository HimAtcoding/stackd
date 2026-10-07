"use client";

import { useEffect, useState } from "react";
import { clearFlash, peekFlash } from "@/lib/flash";
import { Toast } from "./ui/toast";

type FlashToastProps = {
  // As on Toast: the distance from the bottom edge
  bottom: string;
  within?: boolean;
};

// Shows the one-time message left by the screen before, e.g. "Plan saved", "Signed out" or "Account deleted"
export function FlashToast({ bottom, within }: FlashToastProps) {
  const [message, setMessage] = useState(peekFlash);
  useEffect(() => clearFlash(), []);
  return message ? <Toast message={message} bottom={bottom} within={within} onDone={() => setMessage(null)} /> : null;
}
