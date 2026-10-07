"use client";

import { Art } from "@/components/art";
import { PlaceholderScreen } from "@/components/placeholder-screen";
import { Loading } from "@/components/ui/loading";
import { UnofficialFooter } from "@/components/ui/unofficial-footer";
import { campusImage } from "@/lib/campus";
import { retryPlan, usePlan } from "@/lib/data/plan";
import { getAgreementLink, getUniversityRecord, type AgreementLink, type UniversityRecord } from "@/lib/data/university";
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

  if (record.status === "loading") return <div className="min-h-dvh bg-surface pt-[248px]">{waiting("Loading requirements")}</div>;
  // A school the database doesn't have
  if (record.status === "ok" && !university) return <PlaceholderScreen version="signed-in" />;

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
    // "B.S." already ends the sentence with its own period
    const major = target?.majorName ? majorWithDegree(target.majorName, target.degreeType) : null;
    content = (
      <>
        {plan.home && major && (
          <p className="mt-1 px-6 text-slate-600 type-body">
            {plan.home.name} to {major.endsWith(".") ? major : `${major}.`}
          </p>
        )}
        <AgreementCard link={found} college={plan.home?.name ?? null} />
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
