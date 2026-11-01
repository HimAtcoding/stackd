import { Suspense } from "react";
import { PageTransition } from "@/components/page-transition";
import { MajorRoute } from "../_explore/major-screen";

// /explore/major/?slug=computer-science&tab=uc (21). A query string, so a static app can show any major without a rebuild.
export default function MajorPage() {
  return (
    <PageTransition>
      <Suspense fallback={<div className="min-h-dvh bg-sky-50" />}>
        <MajorRoute />
      </Suspense>
    </PageTransition>
  );
}
