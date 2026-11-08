import { Suspense } from "react";
import { ExploreRoute } from "./_explore/explore-screen";

// /explore/ (21), a tab. Search state stays in the screen, so nothing is read from the URL here.
export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-sky-50" />}>
      <ExploreRoute />
    </Suspense>
  );
}
