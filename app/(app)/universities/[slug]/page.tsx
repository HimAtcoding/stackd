import type { Viewport } from "next";
import { Art } from "@/components/art";
import { PageTransition } from "@/components/page-transition";
import { PlaceholderScreen } from "@/components/placeholder-screen";
import { campusImage } from "@/lib/campus";
import { readSeed, readSeedResult, type HomeSeed, type UniversitySeed } from "@/lib/seed";
import { UniversityScreen } from "./_university/university-screen";

// Matches the demo strip at the top of this screen
export const viewport: Viewport = { themeColor: "#051042" };

export default async function UniversityPage({ params }: PageProps<"/universities/[slug]">) {
  const { slug } = await params;

  // Only schools with a seed file get a page; the slug is checked before it touches the file system
  if (!/^[a-z0-9-]+$/.test(slug)) return <PlaceholderScreen version="signed-in" />;
  const result = readSeedResult<UniversitySeed>(`universities/${slug}.json`);
  if (result.status === "missing") return <PlaceholderScreen version="signed-in" />;

  const university = result.status === "ok" ? result.data : null;
  // requirementId → journey step id, so marking a linked row can hand off to the celebration (step 9)
  const steps = readSeed<HomeSeed>("home.json")?.journey?.steps ?? [];
  const journeySteps = Object.fromEntries(steps.filter((s) => s.requirementId).map((s) => [s.requirementId!, s.id]));

  return (
    <PageTransition>
      <UniversityScreen
        slug={slug}
        university={university}
        journeySteps={journeySteps}
        hero={<Art id={campusImage(slug, university?.heroImage)} fill preload className="object-cover object-[center_60%]" />}
      />
    </PageTransition>
  );
}
