import { CalendarDotsIcon, FileTextIcon, PencilSimpleIcon, UsersThreeIcon } from "@phosphor-icons/react/ssr";
import type { HomeTile } from "./home-frame";

// The four shortcut tiles (02). Each screen fills in the subtitles, and where Requirements goes.
type Fill = { subtitle: string; href?: string; unread?: boolean; transitionTypes?: string[] };

export function homeTiles(fill: { requirements: Fill & { href: string }; essays: Fill; mentors: Fill; events: Fill }): HomeTile[] {
  const icon = (Icon: typeof FileTextIcon) => <Icon weight="fill" size={28} className="text-blue-600" />;
  return [
    { title: "Requirements", icon: icon(FileTextIcon), tint: "sky", ...fill.requirements },
    { title: "Essays", icon: icon(PencilSimpleIcon), tint: "indigo", href: "/essays", ...fill.essays },
    { title: "Mentors", icon: icon(UsersThreeIcon), tint: "sky", href: "/mentors", ...fill.mentors },
    { title: "Events", icon: icon(CalendarDotsIcon), tint: "indigo", href: "/events", ...fill.events },
  ];
}
