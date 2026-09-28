import Link from "next/link";
import { CompassIcon, FileTextIcon, HouseIcon, UsersThreeIcon } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/cn";

export type TabId = "home" | "explore" | "essays" | "mentors";

const TABS = [
  { id: "home", label: "Home", href: "/", Icon: HouseIcon },
  { id: "explore", label: "Explore", href: "/explore", Icon: CompassIcon },
  { id: "essays", label: "Essays", href: "/essays", Icon: FileTextIcon },
  { id: "mentors", label: "Mentors", href: "/mentors", Icon: UsersThreeIcon },
] as const;

// Fixed to the bottom. `still` renders it in the page flow for /dev/components.
export function TabBar({ active, still }: { active?: TabId; still?: boolean }) {
  return (
    <nav
      aria-label="Main"
      className={cn(
        "grid grid-cols-4 border-t border-border bg-surface shadow-[0_-8px_24px_rgba(5,16,66,.04)]",
        !still && "fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px]",
      )}
      style={{ height: "calc(56px + var(--safe-bottom))", paddingBottom: "var(--safe-bottom)" }}
    >
      {TABS.map(({ id, label, href, Icon }) => {
        const isActive = id === active;
        return (
          <Link
            key={id}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className="flex flex-col items-center gap-0.5 pt-2 focus-ring:-outline-offset-2"
          >
            <Icon size={28} weight={isActive ? "fill" : "regular"} aria-hidden className={isActive ? "text-blue-600" : "text-slate-400"} />
            <span className={cn("type-tab", isActive ? "text-blue-600" : "text-slate-600")}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
