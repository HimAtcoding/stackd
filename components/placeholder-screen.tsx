"use client";

import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { BarricadeIcon } from "@phosphor-icons/react/ssr";
import { endSession, hasSession, subscribeNoop } from "@/lib/session";
import { BackButton } from "./back-button";
import { EmptyState } from "./ui/empty-state";
import { TabBar, type TabId } from "./ui/tab-bar";
import { TintedButton } from "./ui/tinted-button";
import { PageTransition } from "./page-transition";

// "auto" picks signed in or signed out from the session (Terms, Privacy).
type Version = "signed-out" | "signed-in" | "home" | "auto";

type PlaceholderScreenProps = {
  version: Version;
  tab?: TabId;
};

// Every destination that isn't built yet. Every version has a way out (00 → Placeholder screen).
export function PlaceholderScreen({ version, tab }: PlaceholderScreenProps) {
  const router = useRouter();
  const signedIn = useSyncExternalStore(subscribeNoop, hasSession, () => null);
  if (version === "auto" && signedIn === null) return null;
  const resolved = version === "auto" ? (signedIn ? "signed-in" : "signed-out") : version;

  const copy = {
    "signed-out": {
      title: "This part isn't built yet",
      body: "It's on the list. You can still sign in.",
      action: <TintedButton href="/sign-in">Back to sign in</TintedButton>,
      fallback: "/sign-in",
    },
    "signed-in": {
      title: "This part isn't built yet",
      body: "It's on the list. Your plan is still on the home screen.",
      action: <TintedButton href="/">Back to home</TintedButton>,
      fallback: "/",
    },
    home: {
      title: "Home isn't built yet",
      body: "You're signed in. Sign out to test the sign-in flow again.",
      action: (
        <TintedButton
          onClick={() => {
            endSession();
            router.replace("/sign-in");
          }}
        >
          Sign out
        </TintedButton>
      ),
      fallback: "/",
    },
  }[resolved];

  const showTabBar = resolved !== "signed-out";

  return (
    <PageTransition>
      <main
        className="mx-auto min-h-dvh max-w-[480px] px-4"
        style={{
          paddingTop: "calc(var(--safe-top) + 8px)",
          paddingBottom: showTabBar ? "calc(56px + var(--safe-bottom))" : "var(--safe-bottom)",
        }}
      >
        {/* On "/" there's nothing to go back to, so the button is hidden but keeps its space */}
        <div className={resolved === "home" ? "invisible" : undefined}>
          <BackButton fallback={copy.fallback} />
        </div>
        <EmptyState
          headingLevel={1}
          top={120}
          icon={<BarricadeIcon weight="fill" size={32} />}
          title={copy.title}
          body={copy.body}
          action={copy.action}
        />
      </main>
      {showTabBar && <TabBar active={resolved === "home" ? "home" : tab} />}
    </PageTransition>
  );
}
