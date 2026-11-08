import { PageTransition } from "@/components/page-transition";
import { FeedRoute } from "../_opportunities/feed-screen";

// /explore/opportunities/ (22 → 4), pushed from Explore
export default function OpportunitiesPage() {
  return (
    <PageTransition>
      <FeedRoute />
    </PageTransition>
  );
}
