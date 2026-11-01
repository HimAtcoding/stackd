import type { Metadata } from "next";
import { DocPage, DocSection, ExternalLink, P, SupportEmail } from "@/components/doc-page";
import { GoHome } from "@/components/unbuilt-route";
import { aboutDataHref } from "@/lib/features";

export const metadata: Metadata = { title: "How Stackd checks its data" };

const UC_PATHWAYS = "https://admission.universityofcalifornia.edu/admission-requirements/transfer-requirements/uc-transfer-programs/transfer-pathways/";
const TMC_FORMS =
  "https://www.cccco.edu/About-Us/Chancellors-Office/Divisions/Educational-Services-and-Support/What-we-do/Curriculum-and-Instruction-Unit/Templates-For-Approved-Transfer-Model-Curriculum";

// /about/data/ (21 → How we check this): open to anyone, signed in or not. Behind Explore's flag, since it's about Explore.
export default function AboutDataPage() {
  if (!aboutDataHref()) return <GoHome />;
  return (
    <DocPage title="How we check this">
      <P className="mt-6">Explore shows what to take for your major at UC and Cal State. Here&apos;s where that comes from and how it gets checked.</P>

      <DocSection title="Where it comes from">
        <P>
          UC courses come from UC&apos;s <ExternalLink href={UC_PATHWAYS}>Transfer Pathways</ExternalLink>. Cal State courses come from the California
          Community Colleges Chancellor&apos;s Office <ExternalLink href={TMC_FORMS}>Transfer Model Curriculum templates</ExternalLink>, the statewide plan
          behind each Associate Degree for Transfer.
        </P>
      </DocSection>

      <DocSection title="How it gets checked">
        <P>
          We write every row in our own words from the official page. Then a person checks it against that page before it shows in Stackd. Each major shows
          the date it was checked, and a major stays hidden until all of its rows are checked.
        </P>
      </DocSection>

      <DocSection title="When it changes">
        <P>Requirements change every August, and we check them again then.</P>
      </DocSection>

      <DocSection title="Who we are">
        <P>
          Stackd is an unofficial planning tool. It isn&apos;t affiliated with UC, Cal State, ASSIST, or any college. If an official page disagrees with
          Stackd, the official page is right.
        </P>
      </DocSection>

      <DocSection title="Report a problem">
        <P>
          See something wrong? Email <SupportEmail /> and tell us the major and what you saw.
        </P>
      </DocSection>
    </DocPage>
  );
}
