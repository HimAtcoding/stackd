import { Suspense } from "react";
import { Art } from "@/components/art";
import { PageTransition } from "@/components/page-transition";
import { DeadlinesRoute } from "./_deadlines/deadlines-screen";

// /deadlines/ (14), pushed from Home's Up next. ?id= opens that date's sheet on arrival (from a reminder).
export default function DeadlinesPage() {
  return (
    <PageTransition>
      <Suspense fallback={<div className="min-h-dvh bg-sky-50" />}>
        <DeadlinesRoute husky={<Art id="husky-wave" width={56} />} />
      </Suspense>
    </PageTransition>
  );
}
