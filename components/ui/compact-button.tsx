"use client";

import type { ReactNode } from "react";

type CompactButtonProps = {
  children: ReactNode;
  icon: ReactNode;
  onClick: () => void;
  "aria-label"?: string;
};

// The compact tinted button (15 → Additions to 00): 36 tall, tinted colors, icon 16 + 6 + label. The hit area
// reaches 44 above and below the visible pill.
export function CompactButton({ children, icon, onClick, ...rest }: CompactButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      {...rest}
      className="relative inline-flex h-9 items-center gap-1.5 rounded-full border border-blue-50-border bg-blue-50 px-3 text-blue-700 type-label transition-[background-color,transform] duration-200 ease-out after:absolute after:inset-x-0 after:-inset-y-1 after:content-[''] pressed:bg-blue-100 pressed:duration-120 motion-safe:pressed:scale-[0.98]"
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}
