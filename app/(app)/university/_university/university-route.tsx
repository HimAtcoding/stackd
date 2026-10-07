"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Art } from "@/components/art";
import { PlaceholderScreen } from "@/components/placeholder-screen";
import { campusImage } from "@/lib/campus";
import { getJourneySteps, getUniversity } from "@/lib/data";
import { DEMO_MODE } from "@/lib/flags";
import { AccountUniversity } from "./account-university";
import { DemoRequirements } from "./demo-requirements";
import { UniversityScreen } from "./university-screen";

// Picks the school from ?slug=. Real accounts read the database; demo mode reads data/seed.
export function UniversityRoute() {
  const slug = useSearchParams().get("slug");
  if (!slug) return <PlaceholderScreen version="signed-in" />;
  return DEMO_MODE ? <DemoUniversity slug={slug} /> : <AccountUniversity slug={slug} />;
}

// A demo school with no file gets the placeholder; one that won't load gets the error state.
function DemoUniversity({ slug }: { slug: string }) {
  const router = useRouter();
  const result = getUniversity(slug);
  if (result.status === "missing") return <PlaceholderScreen version="signed-in" />;

  const university = result.status === "ok" ? result.data : null;
  return (
    <UniversityScreen
      slug={slug}
      university={university}
      hero={<Art id={campusImage(slug, university?.heroImage)} fill preload className="object-cover object-[center_60%]" />}
      onRetry={() => router.refresh()}
    >
      {university && <DemoRequirements slug={slug} university={university} journeySteps={getJourneySteps()} />}
    </UniversityScreen>
  );
}
