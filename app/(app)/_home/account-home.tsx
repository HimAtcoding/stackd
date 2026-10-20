"use client";

import { useSyncExternalStore } from "react";
import { InlineError } from "@/components/ui/inline-error";
import { Loading } from "@/components/ui/loading";
import { TintedButton } from "@/components/ui/tinted-button";
import { usePlanScope, useTerm } from "@/lib/data/deadlines";
import { retryPlan, usePlan } from "@/lib/data/plan";
import { cycleLabel } from "@/lib/deadlines";
import { universityHref } from "@/lib/features";
import { onboardingUrl } from "@/lib/onboarding";
import { readFirstName } from "@/lib/profile";
import { subscribeNoop } from "@/lib/session";
import { HomeFrame, type HomeArt } from "./home-frame";
import { PlanRoute } from "./plan-route";
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
  const scope = usePlanScope(plan, state.status === "error");
  const { term } = useTerm();

  // With a term set, the route below names the school, so the subtitle says when instead (15 → Greeting subtitle)
  let subtitle: string | null = null;
  if (plan) {
    if (!first) subtitle = "Let's set up your transfer plan.";
    else if (term) subtitle = `Transferring ${cycleLabel(term).toLowerCase()}.`;
    else subtitle = rest.length ? `Transferring to ${first.name} and ${rest.length} more.` : `Transferring to ${first.name}.`;
  }

  let card;
  if (plan) card = first ? <PlanRoute plan={plan} /> : <SetupCard />;
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
      scope={scope}
      body={
        plan && {
          tiles: homeTiles({
            requirements: first
              ? { subtitle: first.name, href: universityHref(first.slug), transitionTypes: ["push"] }
              : { subtitle: "Set up your plan", href: onboardingUrl("college", { from: "home" }) },
            mentors: COMING_SOON,
            events: COMING_SOON,
          }),
        }
      }
    />
  );
}
