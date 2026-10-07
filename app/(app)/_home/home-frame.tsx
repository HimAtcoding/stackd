"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { BellIcon, GearSixIcon } from "@phosphor-icons/react/ssr";
import { FlashToast } from "@/components/flash-toast";
import { CircleButton } from "@/components/ui/circle-button";
import { DemoStrip } from "@/components/ui/demo-strip";
import { ShortcutTile } from "@/components/ui/shortcut-tile";
import { TabBar } from "@/components/ui/tab-bar";
import type { UpcomingItem } from "@/lib/seed";
import { UpcomingCard } from "./upcoming-card";

export type HomeArt = {
  wordmark: ReactNode;
  husky: ReactNode;
  burst: ReactNode;
  clouds: ReactNode;
};

export type HomeTile = {
  title: string;
  subtitle: string;
  href: string;
  icon: ReactNode;
  tint: "sky" | "indigo";
  unread?: boolean;
  // ["push"] for a screen that slides in (00 → Motion)
  transitionTypes?: string[];
};

type HomeFrameProps = {
  art: HomeArt;
  // Demo records are on screen, so the strip shows
  demo: boolean;
  name: string | null | undefined;
  subtitle?: string | null;
  unread: number;
  // The gear needs a real account (hidden in demo mode)
  settings: boolean;
  // The card right under the greeting, which the husky sits on: journey, plan or setup
  card: ReactNode;
  // Everything under the card. Null while the account's plan is still loading or couldn't load.
  body: { tiles: HomeTile[]; upcoming: UpcomingItem[] } | null;
};

// Home's layout (02), shared by the demo screen and the real-account one
export function HomeFrame({ art, demo, name, subtitle, unread, settings, card, body }: HomeFrameProps) {
  const router = useRouter();

  return (
    <div className="relative min-h-dvh bg-sky-50 bg-[linear-gradient(180deg,var(--sky-100)_0,var(--sky-50)_360px)]">
      {demo && <DemoStrip />}
      <div aria-hidden className="absolute inset-x-0 top-0 h-[300px]">
        {art.clouds}
      </div>

      <main
        className="relative mx-auto max-w-[480px]"
        style={{
          paddingTop: "calc(var(--safe-top) + var(--strip-h) + 8px)",
          paddingBottom: "calc(24px + 56px + var(--safe-bottom))",
        }}
      >
        <header className="flex h-11 items-center justify-between pl-6 pr-4">
          {art.wordmark}
          <div className="flex gap-2">
            {settings && (
              <CircleButton
                aria-label="Settings"
                icon={<GearSixIcon size={24} aria-hidden />}
                onClick={() => router.push("/settings/", { transitionTypes: ["push"] })}
              />
            )}
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
          </div>
        </header>

        <section className="mt-6 px-6">
          {/* Text stays clear of the husky: 200 wide, or up to 8 before the 128-wide husky under 360 */}
          <div className="max-w-[200px] max-[359px]:max-w-[calc(100%-124px)]">
            <h1 className="text-navy-900 [overflow-wrap:anywhere] type-title-1">{name ? `Hi, ${name}!` : "Hi there!"}</h1>
            {subtitle && <p className="mt-1 text-navy-900 type-body">{subtitle}</p>}
          </div>
          <span aria-hidden className="mt-3 block h-1 w-7 rounded-full bg-blue-600" />
        </section>

        {/* The husky hangs from the first card: 12 from the screen edge, its cut edge 4 behind the card's top.
            With no card the wrapper is empty, so the husky still ends above the tiles */}
        <div className="relative mt-8 px-4">
          <div className="relative">
            <div aria-hidden className="absolute -right-1 bottom-[calc(100%-4px)] z-0 w-40 max-[359px]:w-32">
              {art.husky}
              <span className="absolute left-4.5 top-3 -rotate-20">{art.burst}</span>
            </div>
            <div className="relative z-10">{card}</div>
          </div>
        </div>

        {body && (
          <>
            <nav aria-label="Shortcuts" className="mt-3 grid grid-cols-2 gap-3 px-4">
              {body.tiles.map((t) => (
                <ShortcutTile
                  key={t.title}
                  href={t.href}
                  icon={t.icon}
                  iconTint={t.tint}
                  title={t.title}
                  subtitle={t.subtitle}
                  unread={t.unread}
                  transitionTypes={t.transitionTypes}
                  aria-label={`${t.title}, ${t.subtitle}`}
                />
              ))}
            </nav>

            <section className="mt-5">
              <h2 className="px-6 text-navy-900 type-title-2">Upcoming</h2>
              {body.upcoming.length > 0 ? (
                <div className="mt-3 flex flex-col gap-3 px-4">
                  {body.upcoming.map((item) => (
                    <UpcomingCard key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <p className="mt-3 px-6 text-slate-600 type-body">Nothing coming up. Deadlines you save will show here.</p>
              )}
            </section>
          </>
        )}
      </main>

      <TabBar active="home" />
      {/* A message from the screen before, e.g. "Plan saved" after onboarding (10) */}
      <FlashToast bottom="calc(56px + var(--safe-bottom) + 12px)" />
    </div>
  );
}
