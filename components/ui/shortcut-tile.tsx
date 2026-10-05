import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type ShortcutTileProps = {
  href: string;
  icon: ReactNode;
  iconTint: "sky" | "indigo";
  title: string;
  subtitle: string;
  unread?: boolean;
  "aria-label"?: string;
  "data-pressed"?: boolean;
  "data-focus"?: boolean;
};

export function ShortcutTile({ href, icon, iconTint, title, subtitle, unread, ...rest }: ShortcutTileProps) {
  return (
    <Link
      href={href}
      {...rest}
      className={cn(
        "relative flex h-18 items-center gap-3 rounded-md bg-surface pl-3 pr-2 shadow-card",
        "transition-[background-color,transform] duration-200 ease-out",
        "pressed:bg-surface-pressed pressed:duration-120 motion-safe:pressed:scale-[0.98]",
      )}
    >
      <span
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-sm",
          iconTint === "sky" ? "bg-tint-sky" : "bg-tint-indigo",
        )}
      >
        {icon}
      </span>
      {/* No chevron (00 rev 2): text runs to 8 from the right edge. Only the title line is level with the unread dot */}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={cn("truncate text-navy-900 type-label", unread && "pr-4")}>{title}</span>
        <span className="truncate text-slate-600 tabular-nums type-caption">{subtitle}</span>
      </span>
      {unread && <span aria-hidden className="absolute right-3 top-4 size-2 rounded-full bg-coral-500" />}
    </Link>
  );
}
