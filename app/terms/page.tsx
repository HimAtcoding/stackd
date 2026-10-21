import type { Metadata } from "next";
import { DocPage, DocSection, ExternalLink, List, P, SupportEmail } from "@/components/doc-page";
import { TERMS_UPDATED } from "@/lib/about";

export const metadata: Metadata = { title: "Stackd terms of use" };

// /terms/ (12). The unofficial-tool rules from docs/06 and 17 in plain words: Stackd links to the official
// agreement and never stands in for it.
export default function TermsPage() {
  return (
    <DocPage title="Terms of use" updated={TERMS_UPDATED}>
      <P className="mt-6">
        These terms apply when you use Stackd, on the web or in the iPhone app. By using Stackd, you agree to them.
      </P>

      <DocSection title="Stackd is unofficial">
        <P>
          Stackd is an independent planning tool. It isn&apos;t affiliated with, endorsed by, or connected to ASSIST, the
          University of California, the California State University, the California Community Colleges, or any college or
          university.
        </P>
      </DocSection>

      <DocSection title="Check official sources">
        <P>
          Stackd helps you organize a transfer plan and points you to the official transfer agreement for your path. The
          official agreement on <ExternalLink href="https://assist.org">ASSIST</ExternalLink>, your counselor, and the
          universities you apply to are the final word on what counts.
        </P>
        <List>
          <li>Stackd doesn&apos;t guarantee admission to any school or program.</li>
          <li>Stackd doesn&apos;t guarantee that any course will transfer or count toward a requirement.</li>
          <li>Requirements change every year. Information in Stackd can be incomplete or out of date.</li>
        </List>
        <P>Confirm your plan with a counselor before you register for classes or apply.</P>
      </DocSection>

      <DocSection title="Your account">
        <List>
          <li>Give a real email address you can get codes at, and keep your password to yourself.</li>
          <li>Your account is for you alone.</li>
          <li>You can delete your account any time in Settings.</li>
        </List>
      </DocSection>

      <DocSection title="Using Stackd fairly">
        <P>Don&apos;t use Stackd to:</P>
        <List>
          <li>break the law or someone else&apos;s rights,</li>
          <li>get into other people&apos;s accounts or data,</li>
          <li>copy Stackd&apos;s data in bulk, or overload or attack the service.</li>
        </List>
        <P>We can suspend accounts that do.</P>
      </DocSection>

      <DocSection title="Your answers and review comments">
        <List>
          <li>Your essay drafts are yours. Stackd saves them for you and doesn&apos;t claim them or show them to anyone you don&apos;t send a review link to.</li>
          <li>
            Write your answers yourself: UC asks that personal insight answers be your own words. Stackd never writes them for
            you.
          </li>
          <li>
            If you review someone&apos;s answer, comment on the writing. No harassment, hate, threats, sexual content, spam, or
            anything else abusive. Stackd has no tolerance for it.
          </li>
          <li>
            The student who shared the link can delete any comment and turn the link off. Report an abusive comment from its
            menu, or email <SupportEmail />, and we&apos;ll act on it within 24 hours, including removing the content and
            blocking the link.
          </li>
        </List>
      </DocSection>

      <DocSection title="Other websites">
        <P>
          Stackd links to websites it doesn&apos;t run, like ASSIST and university sites. Their own terms and privacy policies
          apply there.
        </P>
      </DocSection>

      <DocSection title="Changes to Stackd">
        <P>
          Stackd is free. We may add, change, or remove features, and we&apos;ll update these terms and the date at the top when
          they change.
        </P>
      </DocSection>

      <DocSection title="No warranty">
        <P>
          Stackd is provided as is, without warranties of any kind. To the extent the law allows, the people behind Stackd
          aren&apos;t liable for decisions made using it, including about courses, applications, or admissions.
        </P>
      </DocSection>

      <DocSection title="The App Store">
        <P>
          If you got Stackd from the App Store, Apple&apos;s standard Licensed Application End User License Agreement also
          applies. Apple isn&apos;t responsible for Stackd or its support.
        </P>
      </DocSection>

      <DocSection title="Law">
        <P>These terms are governed by the laws of the State of California.</P>
      </DocSection>

      <DocSection title="Contact">
        <P>
          Questions about these terms: <SupportEmail />.
        </P>
      </DocSection>
    </DocPage>
  );
}
