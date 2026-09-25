import { BarricadeIcon } from "@phosphor-icons/react/ssr";
import { EmptyState } from "./ui/empty-state";
import { TabBar, type TabId } from "./ui/tab-bar";
import { TintedButton } from "./ui/tinted-button";
import { PageTransition } from "./page-transition";

// Every destination that isn't built yet. Tab destinations keep the tab bar.
export function PlaceholderScreen({ tab }: { tab?: TabId }) {
  return (
    <PageTransition>
      <main
        className="mx-auto min-h-dvh max-w-[480px] px-4"
        style={{
          paddingTop: "calc(var(--safe-top) + var(--strip-h))",
          paddingBottom: tab ? "calc(56px + var(--safe-bottom))" : "var(--safe-bottom)",
        }}
      >
        <EmptyState
          headingLevel={1}
          icon={<BarricadeIcon weight="fill" size={32} />}
          title="This part isn't built yet"
          body="It's on the list. Your plan is still on the home screen."
          action={<TintedButton href="/">Back to home</TintedButton>}
        />
      </main>
      {tab && <TabBar active={tab} />}
    </PageTransition>
  );
}
