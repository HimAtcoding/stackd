"use client";

import { useSyncExternalStore } from "react";
import { InlineError } from "@/components/ui/inline-error";
import { Loading } from "@/components/ui/loading";
import { TintedButton } from "@/components/ui/tinted-button";
import { retryPlan, usePlan } from "@/lib/data/plan";
import { onboardingUrl } from "@/lib/onboarding";
import { readFirstName } from "@/lib/profile";
import { subscribeNoop } from "@/lib/session";
import { HomeFrame, type HomeArt } from "./home-frame";
import { PlanCard } from "./plan-card";
import { SetupCard } from "./setup-card";
import { homeTiles } from "./tiles";

const COMING_SOON = { subtitle: "Coming soon" };

// Home for a real account (02 → Plan states): everything comes from the student's saved plan, never a demo record.
// Journey data doesn't exist for real accounts yet (course matches are locked, docs/16), so it's the setup card or the plan card.
export function AccountHome({ art }: { art: HomeArt }) {
  const state = usePlan();
  const cachedName = useSyncExternalStore(subscribeNoop, readFirstName, () => null);
  const plan = state.status === "ok" ? state.plan : null;
  const [first, ...rest] = plan?.targets ?? [];

  let subtitle: string | null = null;
  if (plan) {
    if (!first) subtitle = "Let's set up your transfer plan.";
    else subtitle = rest.length ? `Transferring to ${first.name} and ${rest.length} more.` : `Transferring to ${first.name}.`;
  }

  let card;
  if (plan) card = first ? <PlanCard plan={plan} /> : <SetupCard />;
  else if (state.status === "error") {
    card = (
      <InlineError
        title="Couldn't load your plan"
        body="Check your connection, then try again."
        action={<TintedButton onClick={retryPlan}>Try again</TintedButton>}
      />
    );
  } else {
    card = (
      <div className="pt-8">
        <Loading label="Loading your plan" />
      </div>
    );
  }

  return (
    <HomeFrame
      art={art}
      demo={false}
      name={plan?.firstName ?? cachedName}
      subtitle={subtitle}
      unread={0}
      settings
      card={card}
      body={
        plan && {
          // No real deadlines in the database yet, so the empty line shows
          upcoming: [],
          tiles: homeTiles({
            requirements: first
              ? { subtitle: first.name, href: `/university/?slug=${first.slug}&tab=requirements`, transitionTypes: ["push"] }
              : { subtitle: "Set up your plan", href: onboardingUrl("college", { from: "home" }) },
            essays: COMING_SOON,
            mentors: COMING_SOON,
            events: COMING_SOON,
          }),
        }
      }
    />
  );
}
