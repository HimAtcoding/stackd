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

// A tab screen's bottom padding: the capsule (68), its 12 above the safe area, and 16 more so the last row clears it
export const TAB_PAGE_BOTTOM = HAS_TAB_BAR ? "calc(96px + var(--safe-bottom))" : "calc(24px + var(--safe-bottom))";

// A toast on a tab screen sits 12 above the capsule
export const TAB_TOAST_BOTTOM = HAS_TAB_BAR ? "calc(92px + var(--safe-bottom))" : "calc(12px + var(--safe-bottom))";

// Where the pill was on the last tab screen, so it can slide from there to this one
let lastIndex: number | null = null;

// The floating capsule (00 → Tab bar): white, 2 px border, its own edge, and a solid blue pill under the active tab.
// Each tab screen renders its own; the pill starts where the last screen left it and
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
        "z-30 h-17 rounded-hero border-2 border-border bg-surface edge-md",
        !still && "fixed inset-x-4 mx-auto max-w-[420px]",
      )}
      style={still ? undefined : { bottom: "calc(var(--safe-bottom) + 12px)" }}
    >
      <div className="relative flex h-full">
        {pill >= 0 && (
          <span
            aria-hidden
            className="absolute top-1 h-[54px] rounded-[18px] bg-blue-600 transition-[left] duration-200 ease-out edge-sm edge-blue-700 motion-reduce:transition-none"
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
              className="relative my-1 flex h-[54px] flex-1 flex-col items-center justify-center gap-0.5 rounded-[18px] focus-ring:outline-offset-1"
            >
              <Icon size={24} weight={isActive ? "fill" : "bold"} aria-hidden className={isActive ? "text-white" : "text-slate-600"} />
              <span className={cn("type-tab", isActive ? "font-black text-white" : "text-slate-600")}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
