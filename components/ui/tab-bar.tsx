import Link from "next/link";
import { CompassIcon, HouseIcon, UsersThreeIcon } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/cn";
import { exploreHref, unbuiltHref } from "@/lib/features";

export type TabId = "home" | "explore" | "essays" | "mentors";

// Only the tabs whose screens are switched on (lib/features.ts). Essays has no tab (17 → Entry points).
const TABS = [
  { id: "home", label: "Home", href: "/", Icon: HouseIcon },
  { id: "explore", label: "Explore", href: exploreHref(), Icon: CompassIcon },
  { id: "mentors", label: "Mentors", href: unbuiltHref("mentors"), Icon: UsersThreeIcon },
].flatMap((t) => (t.href ? [{ ...t, href: t.href }] : []));

// A tab bar with one tab isn't navigation, so with only Home switched on there's none (13 → Home)
export const HAS_TAB_BAR = TABS.length > 1;

// Fixed to the bottom. `still` renders it in the page flow for /dev/components.
export function TabBar({ active, still }: { active?: TabId; still?: boolean }) {
  if (!HAS_TAB_BAR) return null;
  return (
    <nav
      aria-label="Main"
      className={cn(
        // The top line is a shadow, so it takes no space inside the 56.
        "grid bg-surface shadow-[0_-1px_0_var(--border),0_-8px_24px_rgba(5,16,66,.04)]",
        !still && "fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px]",
      )}
      style={{ gridTemplateColumns: `repeat(${TABS.length}, minmax(0, 1fr))`, height: "calc(56px + var(--safe-bottom))", paddingBottom: "var(--safe-bottom)" }}
    >
      {TABS.map(({ id, label, href, Icon }) => {
        const isActive = id === active;
        return (
          <Link
            key={id}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className="flex flex-col items-center gap-0.5 pt-1.5 focus-ring:-outline-offset-2"
          >
            <Icon size={28} weight={isActive ? "fill" : "regular"} aria-hidden className={isActive ? "text-blue-600" : "text-slate-400"} />
            <span className={cn("type-tab", isActive ? "text-blue-600" : "text-slate-600")}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
