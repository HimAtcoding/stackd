import type { Metadata } from "next";
import { Suspense } from "react";
import { ReviewPage } from "./review-page";

// The token is in the address: keep the page out of search results, and send no referrer if a link is followed
export const metadata: Metadata = {
  title: "Stackd review request",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

// /review/?t={token} (19 → Reviewer side): a public page on the website. No sign-in, no tab bar, never redirects.
export default function Review() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-sky-50" />}>
      <ReviewPage />
    </Suspense>
  );
}
