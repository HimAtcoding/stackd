"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

// Fades several art layers in together once every image inside has loaded or failed.
export function RevealGroup({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const imgs = [...(ref.current?.querySelectorAll("img") ?? [])];
    const pending = imgs.filter((img) => !img.complete);
    if (pending.length === 0) {
      setReady(true);
      return;
    }
    let left = pending.length;
    const settle = () => {
      left -= 1;
      if (left === 0) setReady(true);
    };
    pending.forEach((img) => {
      img.addEventListener("load", settle, { once: true });
      img.addEventListener("error", settle, { once: true });
    });
    return () => pending.forEach((img) => {
      img.removeEventListener("load", settle);
      img.removeEventListener("error", settle);
    });
  }, []);

  return (
    <div ref={ref} data-loaded={ready ? "" : undefined} className={cn("art-reveal", className)}>
      {children}
    </div>
  );
}
