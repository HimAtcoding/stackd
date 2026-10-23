import type { Metadata } from "next";
import { DocPage, DocSection, List, P, SupportEmail } from "@/components/doc-page";
import { PRIVACY_UPDATED } from "@/lib/about";

export const metadata: Metadata = { title: "Stackd privacy policy" };

// /privacy/ (12): what Stackd actually stores, checked against supabase/migrations and lib/ on 2026-10-21 (v1.1 adds
// the deadlines tables and profiles.transfer_term; v1.2 adds essay_drafts, review_links and review_comments; v1.3 adds
// essay_drafts.notes and review_links.finished_at). Change it, and PRIVACY_UPDATED, whenever what the app collects changes.
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
            <strong className="font-semibold text-navy-900">Your essay drafts:</strong> the personal insight answers you
            write in Stackd, with their word counts, which questions you chose, and which answers you marked done. They&apos;re
            saved to your account so you can keep writing on any device you sign in on. A file you import is read on your
            phone; only the text you keep is saved.
          </li>
          <li>
            <strong className="font-semibold text-navy-900">Your notes:</strong> notes you write beside an answer are saved
            with that draft and stay private to you. They aren&apos;t part of the answer, so they&apos;re never shared through a
            review link, copied, shared or downloaded with it, and they&apos;re deleted with the draft or your account.
          </li>
          <li>
            <strong className="font-semibold text-navy-900">Review links:</strong> if you ask someone to review an answer,
            we save a copy of that answer as it was when you made the link (or last sent the latest version), the name you
            gave the reviewer, and the link&apos;s dates. The link itself isn&apos;t stored, only a scrambled form of it.
          </li>
          <li>
            <strong className="font-semibold text-navy-900">Reviewers&apos; comments:</strong> anyone who opens a review link
            can read that copy of the answer and your first name, and leave comments under a name they type. We save the
            comments, that name, and the phrase each one is about, with your account. A reviewer doesn&apos;t need an account,
            and never sees your school or email.
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
          <li>To save your essay drafts and show which answers are done.</li>
          <li>To show a reviewer the answer you shared, and show you their comments.</li>
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
          Stackd keeps a copy of your sign-in session, plan, deadlines and essay drafts on your phone or browser, so screens
          load quickly and your writing is kept while you&apos;re offline. A reviewer&apos;s browser remembers the name they
          type and a random key that lets them delete their own comment for 15 minutes.
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
          We keep your information while you have an account. A review link stops working after 14 days, or as soon as you
          turn it off; its comments stay with you until you delete them or the answer. When you delete your account, your
          account, profile, plan, saved schools, progress, deadline marks, reminder choices, essay drafts and notes, review links, and
          the comments on them are deleted right away. Copies in our providers&apos; routine backups and logs are
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
          settings. In an answer&apos;s Reviews section you can turn off any review link and delete any comment; if a
          comment is abusive, use Report on it or email us. A reviewer who wants a comment removed can ask the student, or
          email us. To get a copy of your information, or to correct or delete it, email <SupportEmail />.
        </P>
      </DocSection>

      <DocSection title="Security">
        <P>
          Information travels over encrypted connections (HTTPS). Our database only lets each account read and change its
          own plan, deadlines, essay drafts and review links. Reviewers reach a shared answer only through the link, and only
          while it&apos;s on. No system is perfectly secure, so use a password you don&apos;t use anywhere else.
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
