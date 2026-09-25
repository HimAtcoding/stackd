"use client";

import { useEffect, useRef, useState } from "react";

const SHOW_AFTER_MS = 600;
const FRAME_MS = 140;

// Husky run loop, 2-pose fallback from 05-task-complete. Shows nothing for waits under 600 ms.
export function Loading({ label, immediate }: { label: string; immediate?: boolean }) {
  const [visible, setVisible] = useState(Boolean(immediate));
  const [flight, setFlight] = useState(false);
  const raf = useRef(0);

  useEffect(() => {
    if (visible) return;
    const t = setTimeout(() => setVisible(true), SHOW_AFTER_MS);
    return () => clearTimeout(t);
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let last = performance.now();
    function tick(now: number) {
      if (now - last >= FRAME_MS) {
        last = now;
        setFlight((f) => !f);
      }
      raf.current = requestAnimationFrame(tick);
    }
    function start() {
      cancelAnimationFrame(raf.current);
      if (document.visibilityState === "visible") raf.current = requestAnimationFrame(tick);
    }
    start();
    document.addEventListener("visibilitychange", start);
    return () => {
      cancelAnimationFrame(raf.current);
      document.removeEventListener("visibilitychange", start);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div role="status" className="flex flex-col items-center">
      <div aria-hidden className="relative size-18">
        <span
          className="absolute bottom-0 left-1/2 -ml-[22px] h-1.5 w-11 rounded-full bg-navy-900/10"
          style={{ transform: flight ? "scaleX(0.85)" : undefined }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element -- two stacked frames toggle opacity */}
        <img src="/art/husky/husky-run-contact.png" alt="" width={72} height={72} className="absolute inset-0" style={{ opacity: flight ? 0 : 1 }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/art/husky/husky-run-flight.png"
          alt=""
          width={72}
          height={72}
          className="absolute inset-0"
          style={{ opacity: flight ? 1 : 0, transform: "translateY(-6px)" }}
        />
      </div>
      <p className="mt-2 text-slate-600 type-caption">{label}</p>
    </div>
  );
}
