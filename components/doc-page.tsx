import Link from "next/link";
import type { ReactNode } from "react";
import { BackButton } from "@/components/back-button";
import { PageTransition } from "@/components/page-transition";
import { TextLink } from "@/components/ui/text-link";
import { UnofficialFooter } from "@/components/ui/unofficial-footer";
import { DEVELOPER_CREDIT, SUPPORT_EMAIL } from "@/lib/about";
import { cn } from "@/lib/cn";

// Privacy, Terms and Support (12): text to read, open to anyone, signed in or not. Settings' frame, no cards.
export function DocPage({ title, updated, children }: { title: string; updated?: string; children: ReactNode }) {
  return (
    <PageTransition>
      <main
        className="mx-auto min-h-dvh max-w-[480px] bg-sky-50"
        style={{ paddingTop: "calc(var(--safe-top) + 8px)", paddingBottom: "calc(var(--safe-bottom) + 24px)" }}
      >
        <div className="px-4">
          <BackButton fallback="/" />
        </div>
        <h1 className="mt-6 px-6 text-navy-900 type-title-1">{title}</h1>
        {updated && <p className="mt-2 px-6 text-slate-600 type-caption">Updated {updated}</p>}
        <div className="px-6">{children}</div>
        <footer className="mt-10 px-4 text-center">
          <UnofficialFooter />
          <p className="mt-2 flex justify-center gap-6">
            <TextLink href="/terms/" size="label" className="-mx-2.5 px-2.5">
              Terms
            </TextLink>
            <TextLink href="/privacy/" size="label" className="-mx-2.5 px-2.5">
              Privacy
            </TextLink>
            <TextLink href="/support/" size="label" className="-mx-2.5 px-2.5">
              Support
            </TextLink>
          </p>
          <p className="mt-2 text-slate-600 type-caption">{DEVELOPER_CREDIT}</p>
        </footer>
      </main>
    </PageTransition>
  );
}

export function DocSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-navy-900 type-title-3">{title}</h2>
      {children}
    </section>
  );
}

export function P({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("mt-2 text-slate-700 type-body", className)}>{children}</p>;
}

export function List({ children }: { children: ReactNode }) {
  return <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700 type-body marker:text-slate-600">{children}</ul>;
}

// Outside links open in the browser, so the student never loses their place in Stackd
export function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 underline underline-offset-2">
      {children}
    </a>
  );
}

// A link inside a sentence to another Stackd page
export function InlineLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-semibold text-blue-600 underline underline-offset-2">
      {children}
    </Link>
  );
}

// mailto opens the Mail app, so no new tab
export function SupportEmail() {
  return (
    <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-blue-600 underline underline-offset-2 [overflow-wrap:anywhere]">
      {SUPPORT_EMAIL}
    </a>
  );
}
