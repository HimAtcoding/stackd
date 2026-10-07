"use client";

import { useSyncExternalStore } from "react";
import { getHome, getTargetUniversity } from "@/lib/data";
import { readFirstName } from "@/lib/profile";
import { stepStatus, useRequirementStatuses } from "@/lib/requirements";
import { subscribeNoop } from "@/lib/session";
import { HomeFrame, type HomeArt } from "./home-frame";
import { JourneyCard } from "./journey-card";
import { homeTiles } from "./tiles";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// Home on the demo records in data/seed (NEXT_PUBLIC_DEMO_STRIP=on). No account behind it, so no gear.
export function DemoHome({ art }: { art: HomeArt }) {
  const home = getHome();
  const university = getTargetUniversity();
  const firstName = useSyncExternalStore(subscribeNoop, readFirstName, () => null);
  const statuses = useRequirementStatuses(university?.requirements ?? []);

  const steps = home?.journey?.steps ?? [];
  const inProgress = Object.values(statuses).filter((s) => s === "in_progress").length;
  const counts = home?.counts ?? {};
  // Soonest first; items without a date go last
  const upcoming = [...(home?.upcoming ?? [])].sort((a, b) => (a.dueInDays ?? Infinity) - (b.dueInDays ?? Infinity));

  return (
    <HomeFrame
      art={art}
      demo={Boolean(home?.demo)}
      name={firstName ?? home?.greeting?.demoName}
      subtitle={home?.greeting?.subtitle}
      unread={home?.notifications?.unread ?? 0}
      settings={false}
      card={steps.length > 0 && <JourneyCard statuses={steps.map((s) => stepStatus(s, statuses))} />}
      body={{
        upcoming,
        tiles: homeTiles({
          requirements: {
            subtitle: `${inProgress} in progress`,
            href: university ? `/university/?slug=${university.slug}&tab=requirements` : "/university/",
            transitionTypes: ["push"],
          },
          essays: { subtitle: plural(counts.drafts ?? 0, "draft", "drafts") },
          mentors: {
            subtitle: plural(counts.newMentorMessages ?? 0, "new message", "new messages"),
            unread: (counts.newMentorMessages ?? 0) > 0,
          },
          events: { subtitle: `${counts.upcomingEvents ?? 0} upcoming` },
        }),
      }}
    />
  );
}
