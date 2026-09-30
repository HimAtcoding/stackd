"use client";

import { useRouter } from "next/navigation";
import { useSyncExternalStore, type ReactNode } from "react";
import { BellIcon, CalendarDotsIcon, FileTextIcon, PencilSimpleIcon, UsersThreeIcon } from "@phosphor-icons/react/ssr";
import { CircleButton } from "@/components/ui/circle-button";
import { DemoStrip } from "@/components/ui/demo-strip";
import { ShortcutTile } from "@/components/ui/shortcut-tile";
import { TabBar } from "@/components/ui/tab-bar";
import { readFirstName } from "@/lib/profile";
import { stepStatus, useRequirementStatuses } from "@/lib/requirements";
import type { HomeSeed, UniversitySeed } from "@/lib/seed";
import { subscribeNoop } from "@/lib/session";
import { JourneyCard } from "./journey-card";
import { UpcomingCard } from "./upcoming-card";

type HomeScreenProps = {
  home: HomeSeed | null;
  university: UniversitySeed | null;
  wordmark: ReactNode;
  husky: ReactNode;
  burst: ReactNode;
  clouds: ReactNode;
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function HomeScreen({ home, university, wordmark, husky, burst, clouds }: HomeScreenProps) {
  const router = useRouter();
  const firstName = useSyncExternalStore(subscribeNoop, readFirstName, () => null);
  const statuses = useRequirementStatuses(university?.requirements ?? []);

  const name = firstName ?? home?.greeting?.demoName;
  const unread = home?.notifications?.unread ?? 0;
  const steps = home?.journey?.steps ?? [];
  const inProgress = Object.values(statuses).filter((s) => s === "in_progress").length;
  const counts = home?.counts ?? {};
  // Soonest first; items without a date go last
  const upcoming = [...(home?.upcoming ?? [])].sort((a, b) => (a.dueInDays ?? Infinity) - (b.dueInDays ?? Infinity));

  const tiles = [
    {
      title: "Requirements",
      subtitle: `${inProgress} in progress`,
      href: university ? `/universities/${university.slug}?tab=requirements` : "/universities",
      icon: <FileTextIcon weight="fill" size={24} className="text-blue-600" />,
      tint: "sky" as const,
    },
    {
      title: "Essays",
      subtitle: plural(counts.drafts ?? 0, "draft", "drafts"),
      href: "/essays",
      icon: <PencilSimpleIcon weight="fill" size={24} className="text-blue-600" />,
      tint: "indigo" as const,
    },
    {
      title: "Mentors",
      subtitle: plural(counts.newMentorMessages ?? 0, "new message", "new messages"),
      href: "/mentors",
      icon: <UsersThreeIcon weight="fill" size={24} className="text-blue-600" />,
      tint: "sky" as const,
      unread: (counts.newMentorMessages ?? 0) > 0,
    },
    {
      title: "Events",
      subtitle: `${counts.upcomingEvents ?? 0} upcoming`,
      href: "/events",
      icon: <CalendarDotsIcon weight="fill" size={24} className="text-blue-600" />,
      tint: "indigo" as const,
    },
  ];

  return (
    <div className="relative min-h-dvh bg-sky-50 bg-[linear-gradient(180deg,var(--sky-100)_0,var(--sky-50)_360px)]">
      <DemoStrip />
      <div aria-hidden className="absolute inset-x-0 top-0 h-[300px]">
        {clouds}
      </div>

      <main
        className="relative mx-auto max-w-[480px]"
        style={{
          paddingTop: "calc(var(--safe-top) + var(--strip-h) + 8px)",
          paddingBottom: "calc(24px + 56px + var(--safe-bottom))",
        }}
      >
        <header className="flex h-11 items-center justify-between pl-6 pr-4">
          {wordmark}
          <span className="relative">
            <CircleButton
              aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
              icon={<BellIcon size={24} aria-hidden />}
              onClick={() => router.push("/notifications")}
            />
            {unread > 0 && (
              <span aria-hidden className="pointer-events-none absolute right-1 top-1 size-2.5 rounded-full bg-coral-500 ring-2 ring-surface" />
            )}
          </span>
        </header>

        <section className="relative mt-6 px-6">
          {/* Text stays clear of the husky: 200 wide, or up to 8 before the 128-wide husky under 360 */}
          <div className="max-w-[200px] max-[359px]:max-w-[calc(100%-124px)]">
            <h1 className="text-navy-900 [overflow-wrap:anywhere] type-title-1">{name ? `Hi, ${name}!` : "Hi there!"}</h1>
            {home?.greeting?.subtitle && <p className="mt-1 text-navy-900 type-body">{home.greeting.subtitle}</p>}
          </div>
          <span aria-hidden className="mt-3 block h-1 w-7 rounded-full bg-blue-600" />
          {/* 32 down to the journey card plus 4, so the card covers the husky's cut edge */}
          <div className="absolute -bottom-9 right-3 z-0 w-40 max-[359px]:w-32">
            {husky}
            <span className="absolute left-4.5 top-3 -rotate-20">{burst}</span>
          </div>
        </section>

        {/* Without journey data the gap stays, so the husky still ends above the tiles */}
        <div className="relative z-10 mt-8 px-4">
          {steps.length > 0 && <JourneyCard statuses={steps.map((s) => stepStatus(s, statuses))} />}
        </div>

        <nav aria-label="Shortcuts" className="mt-3 grid grid-cols-2 gap-3 px-4">
          {tiles.map((t) => (
            <ShortcutTile
              key={t.title}
              href={t.href}
              icon={t.icon}
              iconTint={t.tint}
              title={t.title}
              subtitle={t.subtitle}
              unread={t.unread}
              aria-label={`${t.title}, ${t.subtitle}`}
            />
          ))}
        </nav>

        <section className="mt-5">
          <h2 className="px-6 text-navy-900 type-title-2">Upcoming</h2>
          {upcoming.length > 0 ? (
            <div className="mt-3 flex flex-col gap-3 px-4">
              {upcoming.map((item) => (
                <UpcomingCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <p className="mt-3 px-6 text-slate-600 type-body">Nothing coming up. Deadlines you save will show here.</p>
          )}
        </section>
      </main>

      <TabBar active="home" />
    </div>
  );
}
