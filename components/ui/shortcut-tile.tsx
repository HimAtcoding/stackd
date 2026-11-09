import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconCircle, type Tone } from "./icon-circle";

type ShortcutTileProps = {
  href: string;
  // A fill icon at 22, set in the tone's icon circle
  icon: ReactNode;
  tone: Tone;
  title: string;
  subtitle: string;
  unread?: boolean;
  // e.g. ["push"] for a screen that slides in (00 → Motion)
  transitionTypes?: string[];
  "aria-label"?: string;
  "data-pressed"?: boolean;
  "data-focus"?: boolean;
};

// A tappable card 72 tall: icon circle 44 + 12 + title and subtitle (00 → Shortcut tile). No chevron.
export function ShortcutTile({ href, icon, tone, title, subtitle, unread, transitionTypes, ...rest }: ShortcutTileProps) {
  return (
    <Link
      href={href}
      transitionTypes={transitionTypes}
      {...rest}
      className="relative flex h-18 items-center gap-3 rounded-lg border-2 border-border bg-surface pl-2.5 pr-1.5 edge-md"
    >
      <IconCircle tone={tone}>{icon}</IconCircle>
      {/* Text runs to 8 from the right edge. Only the title line is level with the unread dot */}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={cn("truncate text-navy-900 type-label", unread && "pr-5")}>{title}</span>
        <span className="truncate text-slate-600 tabular-nums type-caption">{subtitle}</span>
      </span>
      {unread && <span aria-hidden className="absolute right-2.5 top-3.5 size-2 rounded-full bg-coral-500" />}
    </Link>
  );
}
