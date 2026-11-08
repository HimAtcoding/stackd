"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BellIcon, CheckCircleIcon, CircleIcon } from "@phosphor-icons/react/ssr";
import { BackButton } from "@/components/back-button";
import { RemindersAsk } from "@/components/deadlines/reminders-ask";
import { TurnOnConfirm } from "@/components/deadlines/turn-on-confirm";
import { DateTile } from "@/components/ui/date-row";
import { InlineError } from "@/components/ui/inline-error";
import { domainOf } from "@/components/ui/link-line";
import { Loading } from "@/components/ui/loading";
import { SectionBand } from "@/components/ui/section-band";
import { SourceBlock } from "@/components/ui/source-block";
import { TintedButton } from "@/components/ui/tinted-button";
import { Toast } from "@/components/ui/toast";
import { GoHome } from "@/components/unbuilt-route";
import { SUPPORT_EMAIL } from "@/lib/about";
import { cn } from "@/lib/cn";
import { useNow } from "@/lib/data/deadlines";
import { retryOpportunities, useOpportunities } from "@/lib/data/opportunities";
import { exploreHref } from "@/lib/features";
import {
  applyLine,
  detailLine,
  isOpen,
  pacificToday,
  reminderDays,
  reminderToast,
  shortDay,
  sourceSentence,
  tileParts,
  tileStatus,
  whoItsFor,
  type Opportunity,
  type RuleRow,
} from "@/lib/opportunities";
import { turnOnReminders, useReminders } from "@/lib/reminders";
import { setOpportunityReminder, useOpportunityReminders } from "@/lib/reminders/opportunities";
import { useMajorNamer, useStudent } from "./use-student";

const TOAST_BOTTOM = "calc(var(--safe-bottom) + 12px)";

// With Explore's flag off the address goes Home; an opportunity that isn't listed (or has closed) goes to the feed
export function OpportunityRoute() {
  if (!exploreHref()) return <GoHome />;
  return <OpportunityLoad />;
}

function OpportunityLoad() {
  const router = useRouter();
  const slug = useSearchParams().get("slug");
  const state = useOpportunities();
  const now = useNow();
  const found = state.status === "ok" && now ? state.rows.find((o) => o.slug === slug && isOpen(o, pacificToday(now))) : undefined;
  const missing = state.status === "ok" && now !== null && !found;

  useEffect(() => {
    if (missing) router.replace(exploreHref("opportunities/")!);
  }, [missing, router]);

  if (found) return <OpportunityScreen key={found.slug} o={found} />;
  if (missing) return null;
  return (
    <div className="min-h-dvh overflow-x-clip bg-sky-50">
      <main className="mx-auto max-w-[480px]">
        <SectionBand tone="yellow" title="Opportunities" subtitle="Research programs, scholarships and competitions for transfer students." back={<BackButton fallback={exploreHref("opportunities/")!} slideBack />} />
        {state.status === "error" ? (
          <div className="mx-4 mt-4">
            <InlineError title="Couldn't load this opportunity" body="Check your connection, then try again." action={<TintedButton onClick={retryOpportunities}>Try again</TintedButton>} />
          </div>
        ) : (
          <div className="mt-12">
            <Loading label="Loading this opportunity" />
          </div>
        )}
      </main>
    </div>
  );
}

// A requirement checked against the student: a green check when met, a grey circle otherwise, never a cross (22 → 6)
function Rule({ row }: { row: RuleRow }) {
  const Icon = row.state === "met" ? CheckCircleIcon : CircleIcon;
  return (
    <li className="flex gap-3 py-2">
      <Icon weight={row.state === "met" ? "fill" : "regular"} size={20} aria-hidden className={cn("mt-px shrink-0", row.state === "met" ? "text-green-600" : "text-slate-400")} />
      <span className="min-w-0">
        <span className="block text-navy-900 type-body">
          {row.text}
          <span className="sr-only">{row.state === "met" ? ", checked against your plan" : row.state === "check" ? ", check yourself" : ""}</span>
        </span>
        {row.state === "check" && (
          <span aria-hidden className="mt-0.5 block text-slate-600 type-caption">
            Check yourself
          </span>
        )}
      </span>
    </li>
  );
}

function Bullets({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mt-6 px-6">
      <h2 className="text-navy-900 type-title-3">{title}</h2>
      <ul className="mt-2 flex flex-col gap-2">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-navy-900 type-body">
            <span aria-hidden className="mt-[7px] size-1.5 shrink-0 rounded-full bg-slate-400" />
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

function OpportunityScreen({ o }: { o: Opportunity }) {
  const student = useStudent();
  const nameOf = useMajorNamer();
  const now = useNow();
  const today = now ? pacificToday(now) : null;
  const reminders = useReminders();
  const chosen = useOpportunityReminders().some((r) => r.slug === o.slug);
  const [toast, setToast] = useState<{ key: number; text: string } | null>(null);
  const [asking, setAsking] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const rules = whoItsFor(o, student, nameOf);
  const date = o.deadline ? tileParts(o.deadline) : null;
  const days = o.deadline && now ? reminderDays(o.deadline, now) : [];
  const say = (text: string) => setToast((t) => ({ key: (t?.key ?? 0) + 1, text }));

  function remind() {
    setOpportunityReminder({ slug: o.slug, title: o.title, deadline: o.deadline! }, true);
    say(reminderToast(days));
  }

  // Remind me (22 → 6): iOS's permission first when it hasn't asked, then reminders on if Settings has them off.
  // Tapping again turns this opportunity's reminders off.
  function onRemind() {
    if (chosen) {
      setOpportunityReminder({ slug: o.slug, title: o.title, deadline: o.deadline! }, false);
      return say("Reminders off");
    }
    if (reminders.permission === "denied") return say("Reminders are off for Stackd in your iPhone settings.");
    if (reminders.permission === "prompt") return setAsking(true);
    if (!reminders.on) return setConfirming(true);
    remind();
  }

  async function allow() {
    setAsking(false);
    if ((await turnOnReminders()) === "granted") remind();
  }

  async function turnOn() {
    setConfirming(false);
    if ((await turnOnReminders()) === "granted") remind();
  }

  const report = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Problem with ${o.title} in Opportunities`)}&body=${encodeURIComponent(`Opportunity: ${o.slug}\n\nWhat's wrong:\n`)}`;

  return (
    <div className="min-h-dvh overflow-x-clip bg-sky-50">
      <main className="mx-auto max-w-[480px]" style={{ paddingBottom: "calc(var(--safe-bottom) + 24px)" }}>
        <SectionBand tone="yellow" title={o.title} subtitle={o.org_name} back={<BackButton fallback={exploreHref("opportunities/")!} slideBack />}>
          <div className="flex items-center gap-3 px-6 pb-4 pt-4">
            {today && <DateTile month={date?.month} day={date?.day} status={tileStatus(o, today)} />}
            <div className="min-w-0">
              <p className="text-navy-900 type-label">{applyLine(o)}</p>
              <p className="mt-0.5 text-slate-700 type-caption">{detailLine(o)}</p>
            </div>
          </div>
        </SectionBand>

        <p className="mt-6 px-6 text-navy-900 type-body">{o.summary}</p>

        {rules.length > 0 && (
          <section className="mt-6 px-6">
            <h2 className="text-navy-900 type-title-3">Who it&apos;s for</h2>
            <ul className="mt-1">
              {rules.map((r) => (
                <Rule key={r.text} row={r} />
              ))}
            </ul>
          </section>
        )}
        <Bullets title="What they want" items={o.wants} />
        <Bullets title="What you get" items={o.offers} />

        <div className="mt-8 px-4">
          <a
            href={o.url}
            target="_blank"
            rel="noopener"
            aria-label={`Open the official page, ${domainOf(o.url)}, opens outside the app`}
            className="flex h-14 w-full items-center justify-center rounded-full bg-blue-600 text-white shadow-cta transition-[background-color,transform] duration-200 ease-out type-button-lg pressed:bg-blue-700 pressed:duration-120 focus-ring:outline-offset-3 motion-safe:pressed:scale-[0.97]"
          >
            Open the official page
          </a>
          {o.deadline &&
            (days.length > 0 || chosen) &&
            (reminders.supported ? (
              <button
                type="button"
                onClick={onRemind}
                aria-pressed={chosen}
                className="mx-auto mt-2 flex min-h-11 items-center gap-2 px-2 text-blue-600 type-link pressed:underline focus-ring:underline"
              >
                <BellIcon weight={chosen ? "fill" : "regular"} size={20} aria-hidden />
                {chosen ? "Reminders set" : `Remind me before ${shortDay(o.deadline)}`}
              </button>
            ) : (
              <p className="mt-3 text-center text-slate-600 type-caption">Reminders work in the Stackd iPhone app.</p>
            ))}
        </div>

        <SourceBlock line={sourceSentence(o)} link={{ href: o.source_url, label: domainOf(o.source_url), detail: "" }} report={report} className="mt-8 px-6" />
      </main>

      {reminders.supported && <RemindersAsk open={asking} onAllow={allow} onClose={() => setAsking(false)} />}
      {reminders.supported && <TurnOnConfirm open={confirming} onTurnOn={turnOn} onClose={() => setConfirming(false)} />}
      {toast && <Toast key={toast.key} message={toast.text} bottom={TOAST_BOTTOM} onDone={() => setToast(null)} />}
    </div>
  );
}
