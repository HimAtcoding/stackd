import type { Metadata } from "next";
import { DocPage, DocSection, List, P, SupportEmail } from "@/components/doc-page";
import { PRIVACY_UPDATED } from "@/lib/about";

export const metadata: Metadata = { title: "Stackd privacy policy" };

// /privacy/ (12): what Stackd actually stores, checked against supabase/migrations and lib/ on 2026-10-18 (v1.1 adds
// the deadlines tables and profiles.transfer_term). Change it, and PRIVACY_UPDATED, whenever what the app collects changes.
export default function PrivacyPage() {
  return (
    <DocPage title="Privacy policy" updated={PRIVACY_UPDATED}>
      <P className="mt-6">
        Stackd is a free transfer-planning app for California community college students. This policy says what Stackd
        keeps about you, why, who helps us run it, and how to delete it.
      </P>

      <DocSection title="What we collect">
        <List>
          <li>
            <strong className="font-semibold text-navy-900">Your account:</strong> your email address and first name. If you
            sign up with email, your password is stored by our sign-in provider as a one-way hash; we never see it.
          </li>
          <li>
            <strong className="font-semibold text-navy-900">Sign in with Apple or Google:</strong> the account ID and email
            address Apple or Google shares with us, and your first name if they share it. With Apple&apos;s Hide My Email, we only
            get the private relay address.
          </li>
          <li>
            <strong className="font-semibold text-navy-900">Your plan:</strong> your community college, the universities and
            majors you pick, the schools you save, and any progress you mark.
          </li>
          <li>
            <strong className="font-semibold text-navy-900">Your deadlines:</strong> the term you plan to transfer, which
            deadlines and application checklist steps you mark done, and the reminders you choose for each deadline.
          </li>
          <li>
            <strong className="font-semibold text-navy-900">Service logs:</strong> like most online services, our backend
            keeps standard logs of requests and sign-ins, including IP address and browser or device details, to keep
            accounts secure and the service running.
          </li>
        </List>
        <P>
          We don&apos;t collect your location, contacts, photos, transcripts, grades, or payment details. Stackd has no ads, no
          analytics or advertising tools, and doesn&apos;t track you across other apps or websites. None of what we keep is
          used for tracking or ads.
        </P>
      </DocSection>

      <DocSection title="How we use it">
        <List>
          <li>To sign you in and keep your account secure.</li>
          <li>To save your plan and show it on every device you sign in on.</li>
          <li>To show your deadlines and checklist, and to set up the reminders you turn on.</li>
          <li>To email you 6-digit codes that confirm your email or reset your password.</li>
          <li>To greet you by name in the app.</li>
          <li>To answer you when you contact support.</li>
        </List>
        <P>We don&apos;t sell your information or share it for advertising.</P>
      </DocSection>

      <DocSection title="Who helps us run Stackd">
        <List>
          <li>Supabase stores your account and plan and handles sign-in.</li>
          <li>Google sends our sign-in code emails (Gmail), and signs you in if you choose Continue with Google.</li>
          <li>Apple signs you in if you choose Sign in with Apple, and distributes the iPhone app.</li>
          <li>Vercel hosts the Stackd website.</li>
        </List>
        <P>
          They process your information only to provide these services to us. We share information with anyone else only if
          the law requires it.
        </P>
      </DocSection>

      <DocSection title="On your device">
        <P>
          Stackd keeps a copy of your sign-in session, plan and deadlines on your phone or browser, so screens load quickly.
          Signing out removes your account&apos;s copy from that device.
        </P>
        <P>
          Deadline reminders are local notifications: your iPhone schedules and shows them itself. We don&apos;t send them, and
          nothing is sent to us when one goes off. The reminder days you pick for a deadline are saved with your account, so
          they follow you to a new phone. The reminders switch and default days in Settings stay on the phone. Signing out
          cancels Stackd&apos;s reminders on that phone.
        </P>
      </DocSection>

      <DocSection title="How long we keep it">
        <P>
          We keep your information while you have an account. When you delete your account, your account, profile, plan,
          saved schools, progress, deadline marks, and reminder choices are deleted right away. Copies in our providers&apos; routine backups and logs are
          overwritten on their normal schedule.
        </P>
      </DocSection>

      <DocSection title="Deleting your account">
        <P>
          In the app, open Settings from the gear on Home and tap Delete account. You can also email <SupportEmail /> from
          the address on your account and we&apos;ll delete it for you.
        </P>
      </DocSection>

      <DocSection title="Your choices">
        <P>
          You can change your plan any time in Settings, and turn deadline reminders off there or in your iPhone&apos;s
          settings. To get a copy of your information, or to correct or delete it, email <SupportEmail />.
        </P>
      </DocSection>

      <DocSection title="Security">
        <P>
          Information travels over encrypted connections (HTTPS). Our database only lets each account read and change its
          own plan and deadlines. No system is perfectly secure, so use a password you don&apos;t use anywhere else.
        </P>
      </DocSection>

      <DocSection title="Children">
        <P>
          Stackd is for college students and isn&apos;t directed to children under 13. We don&apos;t knowingly collect information from
          children under 13. If you think a child has given us information, email us and we&apos;ll delete it.
        </P>
      </DocSection>

      <DocSection title="Changes">
        <P>
          If we change what we collect or how we use it, we&apos;ll update this page and the date at the top, and tell you in the
          app before a significant change applies to you.
        </P>
      </DocSection>

      <DocSection title="Contact">
        <P>
          Questions about privacy: <SupportEmail />.
        </P>
      </DocSection>
    </DocPage>
  );
}
