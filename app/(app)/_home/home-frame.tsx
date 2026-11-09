"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { BellIcon } from "@phosphor-icons/react/ssr";
import { FlashToast } from "@/components/flash-toast";
import { CircleButton } from "@/components/ui/circle-button";
import { DemoStrip } from "@/components/ui/demo-strip";
import type { Tone } from "@/components/ui/icon-circle";
import { ShortcutTile } from "@/components/ui/shortcut-tile";
import { TAB_PAGE_BOTTOM, TAB_TOAST_BOTTOM, TabBar } from "@/components/ui/tab-bar";
import { UnofficialFooter } from "@/components/ui/unofficial-footer";
import { useDeadlines, type ScopeState } from "@/lib/data/deadlines";
import { FEATURES, unbuiltHref } from "@/lib/features";
import { NextSteps } from "./next-steps";

export type HomeArt = {
  husky: ReactNode;
  burst: ReactNode;
  clouds: ReactNode;
};

export type HomeTile = {
  title: string;
  subtitle: string;
  href: string;
  icon: ReactNode;
  tone: Tone;
  unread?: boolean;
  // ["push"] for a screen that slides in (00 → Motion)
  transitionTypes?: string[];
};

type HomeFrameProps = {
  art: HomeArt;
  // Demo records are on screen, so the strip shows
  demo: boolean;
  name: string | null | undefined;
  // The route under the greeting ("Las Positas College to UC San Diego"), or what to do first
  subtitle?: string | null;
  unread: number;
  // A card that leads instead of the Up next hero, with the husky behind it: setup, the plan loading or failing,
  // or the demo's journey card. Null when the plan is there, so the hero leads.
  card: ReactNode;
  // Everything under the card. Null while the account's plan is still loading or couldn't load.
  body: { tiles: HomeTile[] } | null;
  // The schools whose deadlines Up next and Get ready show (14)
  scope: ScopeState;
};

// Home's layout (02, 23 → Home), shared by the demo screen and the real-account one. lib/features.ts decides what's
// on it: the greeting, the hero and step path when dates are on, the tiles that are on, and the footer line. Settings is the
// tab bar's You (22 → 1), so the header has no gear.
export function HomeFrame({ art, demo, name, subtitle, unread, card, body, scope }: HomeFrameProps) {
  const router = useRouter();
  const notifications = unbuiltHref("notifications");
  const deadlines = useDeadlines(scope);
  // No plan yet: the setup card is the one thing to do, so Get ready waits until there's a plan (14 → Get ready card)
  const showGetReady = FEATURES.getReady && !(scope.status === "ok" && scope.scope === null);
  // Stand-in deadline rows are demo records, so the strip shows with them (00 → Demo strip)
  const demoDates =
    deadlines.status === "ok" &&
    ((FEATURES.upcoming && deadlines.view.demo) || (showGetReady && Boolean(deadlines.checklist?.checklist.demo)));

  return (
    <div className="relative min-h-dvh bg-page">
      {(demo || demoDates) && <DemoStrip />}
      <div aria-hidden className="absolute inset-x-0 top-0 h-[300px]">
        {art.clouds}
      </div>

      <main
        className="relative mx-auto max-w-[480px]"
        style={{
          paddingTop: "calc(var(--safe-top) + var(--strip-h) + 8px)",
          paddingBottom: TAB_PAGE_BOTTOM,
        }}
      >
        {notifications && (
          <header className="flex h-11 items-center justify-end px-4">
            <span className="relative">
              <CircleButton
                aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
                icon={<BellIcon weight="bold" size={24} aria-hidden />}
                onClick={() => router.push(notifications)}
              />
              {unread > 0 && (
                <span aria-hidden className="pointer-events-none absolute right-1 top-1 size-2.5 rounded-full bg-coral-500 ring-2 ring-surface" />
              )}
            </span>
          </header>
        )}

        {/* The greeting (23 → Home hero): the app's name, the name, and the route. Text stays clear of the 132-wide
            husky at the right (112 under 360) */}
        <section className={notifications ? "px-6" : "mt-4 px-6"}>
          <p className="text-blue-600 type-label">stackd</p>
          <div className="max-w-[200px] max-[359px]:max-w-[calc(100%-120px)]">
            <h1 className="mt-1 text-navy-900 [overflow-wrap:anywhere] type-title-1">{name ? `Hi, ${name}!` : "Hi there!"}</h1>
            {subtitle && <p className="mt-1 text-slate-600 type-body">{subtitle}</p>}
          </div>
        </section>

        <NextSteps
          state={deadlines}
          lead={card}
          husky={
            <>
              {art.husky}
              <span className="absolute left-4 top-2.5 -rotate-20">{art.burst}</span>
            </>
          }
          showUpNext={FEATURES.upcoming && body !== null}
          showPath={showGetReady && body !== null}
          toastBottom={TAB_TOAST_BOTTOM}
        />

        {body && (
          <>
            {body.tiles.length > 0 && (
              <nav aria-label="Shortcuts" className="mt-8 grid grid-cols-2 gap-3 px-4">
                {body.tiles.map((t) => (
                <ShortcutTile
                  key={t.title}
                  href={t.href}
                  icon={t.icon}
                  tone={t.tone}
                  title={t.title}
                  subtitle={t.subtitle}
                  unread={t.unread}
                  transitionTypes={t.transitionTypes}
                    aria-label={`${t.title}, ${t.subtitle}`}
                  />
                ))}
              </nav>
            )}

            {/* Home names a university, so it carries the unofficial line (00), 24 below the last block */}
            <UnofficialFooter className="mt-6 px-4" />
          </>
        )}
      </main>

      <TabBar active="home" />
      {/* A message from the screen before, e.g. "Plan saved" after onboarding (10) */}
      <FlashToast bottom={TAB_TOAST_BOTTOM} />
    </div>
  );
}
