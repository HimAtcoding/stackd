"use client";

import { useSearchParams } from "next/navigation";
import { Art } from "@/components/art";
import { PlaceholderScreen } from "@/components/placeholder-screen";
import { campusImage } from "@/lib/campus";
import { getJourneySteps, getUniversity } from "@/lib/data";
import { UniversityScreen } from "./university-screen";

// Picks the school from ?slug=. A school with no data gets the placeholder; one that won't load gets the error state.
export function UniversityRoute() {
  const slug = useSearchParams().get("slug");
  const result = getUniversity(slug);
  if (!slug || result.status === "missing") return <PlaceholderScreen version="signed-in" />;

  const university = result.status === "ok" ? result.data : null;
  return (
    <UniversityScreen
      slug={slug}
      university={university}
      journeySteps={getJourneySteps()}
      hero={<Art id={campusImage(slug, university?.heroImage)} fill preload className="object-cover object-[center_60%]" />}
    />
  );
}
