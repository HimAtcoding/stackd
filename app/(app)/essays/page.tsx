import { Suspense } from "react";
import { PageTransition } from "@/components/page-transition";
import { EssaysRoute } from "./_essays/essays-screen";

// /essays/ (17): the four personal insight answers, pushed from Home's row or a step sheet's link
export default function EssaysPage() {
  return (
    <PageTransition>
      <Suspense fallback={<div className="min-h-dvh bg-sky-50" />}>
        <EssaysRoute />
      </Suspense>
    </PageTransition>
  );
}
