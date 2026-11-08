import { Suspense } from "react";
import { PageTransition } from "@/components/page-transition";
import { OpportunityRoute } from "../../_opportunities/opportunity-screen";

// /explore/opportunities/item/?slug=… (22 → 6). A query string, so a static app can show any opportunity without a rebuild.
export default function OpportunityPage() {
  return (
    <PageTransition>
      <Suspense fallback={<div className="min-h-dvh bg-page" />}>
        <OpportunityRoute />
      </Suspense>
    </PageTransition>
  );
}
