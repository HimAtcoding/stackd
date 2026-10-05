import type { Viewport } from "next";
import { Suspense } from "react";
import { PageTransition } from "@/components/page-transition";
import { UniversityRoute } from "./_university/university-route";

// Matches the demo strip at the top of this screen
export const viewport: Viewport = { themeColor: "#051042" };

// /university/?slug=uc-davis&tab=requirements. A query string, not a [slug] folder, so a static app can show
// any school the data has without being rebuilt.
export default function UniversityPage() {
  return (
    <PageTransition>
      {/* A full-screen sheet while ?slug= is read, so the push always has something to slide in */}
      <Suspense fallback={<div className="min-h-dvh bg-surface" />}>
        <UniversityRoute />
      </Suspense>
    </PageTransition>
  );
}
