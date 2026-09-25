"use client";

import { useState, type ReactNode } from "react";

// Expands from height 0 with opacity over 200 ms. Keeps the last content while collapsing.
export function Expand({ open, children }: { open: boolean; children: ReactNode }) {
  const [kept, setKept] = useState<ReactNode>(children);
  if (open && children !== kept) setKept(children);

  return (
    <div
      className="grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-opacity"
      style={{ gridTemplateRows: open ? "1fr" : "0fr", opacity: open ? 1 : 0 }}
      aria-hidden={!open || undefined}
    >
      <div className="min-h-0 overflow-hidden">{open ? children : kept}</div>
    </div>
  );
}
