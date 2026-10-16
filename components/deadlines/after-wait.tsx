"use client";

import { useEffect, useState, type ReactNode } from "react";

// Shows its children only once a wait passes 600 ms (00 → Loading), so short loads show nothing
export function AfterWait({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(t);
  }, []);
  return visible ? children : null;
}
