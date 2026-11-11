import { exploreHref } from "@/lib/features";
import { loadDeadlines } from "./deadlines";
import { loadEssays } from "./essays";
import { loadExplore, preloadAgreements } from "./explore";
import { loadOpportunities } from "./opportunities";
import { loadPlan, readPlanState, subscribePlan } from "./plan";
import { loadReviews } from "./reviews";
import { loadStatuses } from "./topic-status";

// Reads every tab's data in the background once the plan is on screen, so Explore, its major page, Opportunities,
// Essays and Deadlines open with their data already on the phone. Each read happens once; a screen that opens while
// one is on its way waits for that read instead of starting another.
export function preloadTabs(): () => void {
  let started = false;
  const run = () => {
    const plan = readPlanState();
    if (plan.status !== "ok") return;
    if (!started) {
      started = true;
      loadDeadlines();
      loadEssays();
      loadReviews(true);
      if (exploreHref()) {
        loadExplore();
        loadOpportunities();
        loadStatuses();
      }
    }
    // Again when the plan changes, for a major just added
    if (exploreHref()) preloadAgreements(plan.plan);
  };
  const stop = subscribePlan(run);
  loadPlan();
  run();
  return stop;
}
