"use client";

import Link from "next/link";
import { useLayoutEffect, useState } from "react";
import { CompassIcon, HouseIcon, PencilLineIcon, UserCircleIcon } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/cn";
import { essaysHref, exploreHref } from "@/lib/features";
import { DEMO_MODE } from "@/lib/flags";

export type TabId = "home" | "explore" | "essays" | "you";

// Only the tabs whose screens are switched on (22 → 1). You is Settings, which needs a real account.
const TABS = [
  { id: "home", label: "Home", href: "/", Icon: HouseIcon },
  { id: "explore", label: "Explore", href: exploreHref(), Icon: CompassIcon },
  { id: "essays", label: "Essays", href: essaysHref(), Icon: PencilLineIcon },
  { id: "you", label: "You", href: DEMO_MODE ? null : "/settings/", Icon: UserCircleIcon },
].flatMap((t) => (t.href ? [{ ...t, href: t.href }] : []));

// A tab bar with one tab isn't navigation, so with only Home switched on there's none (13 → Home)
export const HAS_TAB_BAR = TABS.length > 1;

// A tab screen's bottom padding: the capsule (64), its 12 above the safe area, and 16 more so the last row clears it
export const TAB_PAGE_BOTTOM = HAS_TAB_BAR ? "calc(92px + var(--safe-bottom))" : "calc(24px + var(--safe-bottom))";

// A toast on a tab screen sits 12 above the capsule
export const TAB_TOAST_BOTTOM = HAS_TAB_BAR ? "calc(88px + var(--safe-bottom))" : "calc(12px + var(--safe-bottom))";

// Where the pill was on the last tab screen, so it can slide from there to this one
let lastIndex: number | null = null;

// The floating capsule (22 → 1). Each tab screen renders its own; the pill starts where the last screen left it and
// slides to this tab. `still` renders it in the page flow for /dev/components.
export function TabBar({ active, still }: { active?: TabId; still?: boolean }) {
  const index = TABS.findIndex((t) => t.id === active);
  const [pill, setPill] = useState(still ? index : (lastIndex ?? index));

  useLayoutEffect(() => {
    if (still) return;
    lastIndex = index;
    // The next frame, so the browser paints the old place first and the move animates
    const frame = requestAnimationFrame(() => setPill(index));
    return () => cancelAnimationFrame(frame);
  }, [index, still]);

  if (!HAS_TAB_BAR) return null;
  const width = 100 / TABS.length;
  return (
    <nav
      aria-label="Main"
      className={cn(
        "z-30 h-16 rounded-full border border-border bg-surface shadow-float supports-[backdrop-filter]:bg-surface/92 supports-[backdrop-filter]:backdrop-blur-[20px]",
        !still && "fixed inset-x-4 mx-auto max-w-[420px]",
      )}
      style={still ? undefined : { bottom: "calc(var(--safe-bottom) + 12px)" }}
    >
      <div className="relative flex h-full">
        {pill >= 0 && (
          <span
            aria-hidden
            className="absolute inset-y-1.5 rounded-full bg-surface-pressed transition-[left] duration-200 ease-out motion-reduce:transition-none"
            style={{ left: `calc(${pill * width}% + 6px)`, width: `calc(${width}% - 12px)` }}
          />
        )}
        {TABS.map(({ id, label, href, Icon }) => {
          const isActive = id === active;
          return (
            <Link
              key={id}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className="relative flex min-h-11 flex-1 flex-col items-center justify-center gap-1 rounded-full focus-ring:-outline-offset-4"
            >
              <Icon size={24} weight={isActive ? "fill" : "regular"} aria-hidden className={isActive ? "text-blue-700" : "text-slate-600"} />
              <span className={cn("type-tab", isActive ? "text-blue-700" : "text-slate-600")}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
