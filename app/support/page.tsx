import type { Metadata } from "next";
import { DocPage, DocSection, ExternalLink, InlineLink, List, P, SupportEmail } from "@/components/doc-page";

export const metadata: Metadata = { title: "Stackd support" };

// /support/ (12): the App Store's support URL. How to reach the team, and answers to the questions sign-in raises.
export default function SupportPage() {
  return (
    <DocPage title="Support">
      <P className="mt-6">
        Stackd helps California community college students plan a transfer. Pick your college, the universities you&apos;re
        aiming for, and your major. Stackd saves your plan to your account and opens the official transfer agreement for
        your path on ASSIST.
      </P>

      <DocSection title="Contact us">
        <P>
          Email <SupportEmail />. Tell us what you tapped and what happened, and which device you&apos;re on. Never send us your
          password.
        </P>
      </DocSection>

      <DocSection title="Signing in">
        <List>
          <li>Sign in with your email and password, Sign in with Apple, or Continue with Google.</li>
          <li>
            A new email account gets a 6-digit code by email. Enter it in Stackd to confirm your email. No code? Check spam,
            wait a minute, then tap Send a new code.
          </li>
          <li>Forgot your password? On Sign in, tap Forgot password and we&apos;ll email you a 6-digit code to set a new one.</li>
          <li>
            Signed up with Apple or Google? Use the same button to sign in again. Your account doesn&apos;t have a Stackd
            password.
          </li>
        </List>
      </DocSection>

      <DocSection title="Changing your plan">
        <P>Open Settings from the gear on Home. Under Your plan, change your college, schools, or major.</P>
      </DocSection>

      <DocSection title="Deleting your account">
        <P>
          Open Settings and tap Delete account. Your account, plan, and progress are deleted right away and can&apos;t be brought
          back. Can&apos;t sign in? Email <SupportEmail /> from the address on your account and we&apos;ll delete it for you.
        </P>
      </DocSection>

      <DocSection title="Is Stackd official?">
        <P>
          No. Stackd is an unofficial planning tool. It isn&apos;t affiliated with ASSIST, the UC, the CSU, or any college, and it
          doesn&apos;t guarantee admission or that a course will transfer. Check the official agreement on{" "}
          <ExternalLink href="https://assist.org">ASSIST</ExternalLink> and talk to your counselor.
        </P>
      </DocSection>

      <DocSection title="Privacy and terms">
        <P>
          Read the <InlineLink href="/privacy/">privacy policy</InlineLink> and the{" "}
          <InlineLink href="/terms/">terms of use</InlineLink>.
        </P>
      </DocSection>
    </DocPage>
  );
}
