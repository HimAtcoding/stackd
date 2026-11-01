"use client";

import { CompassIcon } from "@phosphor-icons/react/ssr";
import { Art } from "@/components/art";
import { GoHome } from "@/components/unbuilt-route";
import { LinkLine } from "@/components/ui/link-line";
import { Loading } from "@/components/ui/loading";
import { UnofficialFooter } from "@/components/ui/unofficial-footer";
import { campusImage } from "@/lib/campus";
import { useMajors } from "@/lib/data/explore";
import { retryPlan, usePlan } from "@/lib/data/plan";
import { getAgreementLink, getUniversityRecord, type AgreementLink, type UniversityRecord } from "@/lib/data/university";
import { pathwayOn } from "@/lib/explore";
import { exploreHref } from "@/lib/features";
import { institutionKind, majorWithDegree } from "@/lib/format";
import { useLoaded } from "@/lib/use-loaded";
import { AgreementCard } from "./agreement-card";
import { LoadError, UniversityScreen } from "./university-screen";

const waiting = (label: string) => (
  <div className="pt-12">
    <Loading label={label} />
  </div>
);

// The university screen for a real account (03 → Real accounts): the school comes from the database, and the
// Requirements tab shows the official agreement for the student's own path, never requirement rows or demo records.
export function AccountUniversity({ slug }: { slug: string }) {
  const [record, retryRecord] = useLoaded<UniversityRecord | null>(`university:${slug}`, () => getUniversityRecord(slug));
  const planState = usePlan();
  const plan = planState.status === "ok" ? planState.plan : null;
  const university = record.status === "ok" ? record.data : null;

  // The student's path to this school: home college → this school → the major they picked for it
  const target = plan?.targets.find((t) => t.slug === slug);
  const path = plan?.home && university && target?.majorId ? { collegeId: plan.home.id, universityId: university.id, majorId: target.majorId } : null;
  const [link, retryLink] = useLoaded<AgreementLink | null>(
    path ? `link:${path.collegeId}:${path.universityId}:${path.majorId}` : null,
    () => getAgreementLink(path!),
  );

  // The plan's major in Explore, on the tab for this school (21 → Elsewhere in the app)
  const majors = useMajors();
  const exploreMajor = majors.status === "ok" ? majors.majors.find((m) => m.slug === target?.exploreSlug) : undefined;
  const wantedTab = university?.system?.toUpperCase() === "CSU" ? "cal-state" : "uc";
  const seeWhatToTake = exploreMajor && exploreHref(`major/?slug=${exploreMajor.slug}&tab=${pathwayOn(exploreMajor, wantedTab) ? wantedTab : "uc"}`);

  if (record.status === "loading") return <div className="min-h-dvh bg-surface pt-[248px]">{waiting("Loading requirements")}</div>;
  // A school the database doesn't have goes Home (13: no dead ends)
  if (record.status === "ok" && !university) return <GoHome />;

  let content;
  if (planState.status === "error" || (path && link.status === "error")) {
    content = (
      <div className="mx-4 mt-4">
        <LoadError onRetry={() => (planState.status === "error" ? retryPlan() : retryLink())} />
      </div>
    );
  } else if (!plan || (path && link.status === "loading")) {
    content = waiting("Loading requirements");
  } else {
    const found = path && link.status === "ok" ? link.data : null;
    // "{major} from {college}.", worded like Home's plan card; with no college, just the major
    const major = target?.majorName ? majorWithDegree(target.majorName, target.degreeType) : null;
    const line = major && (plan.home ? `${major} from ${plan.home.name}` : major);
    content = (
      <>
        {/* "B.S." already ends the sentence with its own period */}
        {line && <p className="mt-1 px-6 text-slate-600 type-body">{line.endsWith(".") ? line : `${line}.`}</p>}
        <AgreementCard link={found} college={plan.home?.name ?? null} />
        {seeWhatToTake && target?.majorName && (
          <LinkLine
            href={seeWhatToTake}
            label={`See what to take for ${target.majorName}`}
            detail="Explore"
            icon={<CompassIcon weight="bold" size={16} />}
            className="mx-6 mt-3"
          />
        )}
        <UnofficialFooter className="mt-4 px-4" />
      </>
    );
  }

  return (
    <UniversityScreen
      slug={slug}
      university={
        university && {
          name: university.name,
          type: institutionKind(university.system),
          city: university.city && university.state ? `${university.city}, ${university.state}` : university.city,
        }
      }
      hero={<Art id={campusImage(slug)} fill preload className="object-cover object-[center_60%]" />}
      onRetry={retryRecord}
    >
      {content}
    </UniversityScreen>
  );
}
