import { CalendarDotsIcon, FileTextIcon, PencilSimpleIcon, UsersThreeIcon } from "@phosphor-icons/react/ssr";
import { unbuiltHref } from "@/lib/features";
import type { HomeTile } from "./home-frame";

// The shortcut tiles (02). Each screen fills in the subtitles, and where Requirements goes.
type Fill = { subtitle: string; unread?: boolean; transitionTypes?: string[] };

// Only tiles whose screens are switched on (lib/features.ts). Requirements alone would only repeat the plan or
// setup card above it, so with no other tile there are none (13 → Home).
export function homeTiles(fill: { requirements: Fill & { href: string }; essays: Fill; mentors: Fill; events: Fill }): HomeTile[] {
  const icon = (Icon: typeof FileTextIcon) => <Icon weight="fill" size={28} className="text-blue-600" />;
  const others = [
    { title: "Essays", icon: icon(PencilSimpleIcon), tint: "indigo" as const, href: unbuiltHref("essays"), ...fill.essays },
    { title: "Mentors", icon: icon(UsersThreeIcon), tint: "sky" as const, href: unbuiltHref("mentors"), ...fill.mentors },
    { title: "Events", icon: icon(CalendarDotsIcon), tint: "indigo" as const, href: unbuiltHref("events"), ...fill.events },
  ].flatMap((t) => (t.href ? [{ ...t, href: t.href }] : []));
  if (!others.length) return [];
  return [{ title: "Requirements", icon: icon(FileTextIcon), tint: "sky", ...fill.requirements }, ...others];
}
