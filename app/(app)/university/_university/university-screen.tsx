"use client";

import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { BarricadeIcon } from "@phosphor-icons/react/ssr";
import { BackButton } from "@/components/back-button";
import { DemoStrip } from "@/components/ui/demo-strip";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineError } from "@/components/ui/inline-error";
import { TintedButton } from "@/components/ui/tinted-button";
import { UnderlineTabs } from "@/components/ui/underline-tabs";
import { SaveButton } from "./save-button";

type TabId = "overview" | "requirements" | "student-life";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "requirements", label: "Requirements" },
  { id: "student-life", label: "Student life" },
];

type UniversityScreenProps = {
  slug: string;
  // Null when the school exists but couldn't be loaded
  university: { name: string; type: string | null; city: string | null; demo?: boolean } | null;
  hero: ReactNode;
  // What "Try again" does after a failed load
  onRetry: () => void;
  // The Requirements tab, below its "Transfer requirements" title
  children: ReactNode;
};

// The university screen's frame (03): hero, back and save, the sheet with the name and tabs.
// Demo schools and real accounts fill the Requirements tab differently.
export function UniversityScreen({ slug, university, hero, onRetry, children }: UniversityScreenProps) {
  // The URL is the only source of the tab, so Back from a detail screen shows the tab it left
  const param = useSearchParams().get("tab");
  const tab = TABS.find((t) => t.id === param)?.id ?? "requirements";

  // Switching tabs replaces ?tab= (keeping ?slug=) without adding a history entry
  function changeTab(id: string) {
    const params = new URLSearchParams(window.location.search);
    params.set("tab", id);
    window.history.replaceState(null, "", `?${params}`);
  }

  return (
    <div className="min-h-dvh bg-surface">
      {university?.demo && <DemoStrip />}
      <main className="mx-auto max-w-[480px]">
        {/* Hero runs under the status bar; the scrim keeps the status bar legible on busy art */}
        <div className="relative h-[248px] overflow-hidden bg-sky-100">
          {hero}
          <div aria-hidden className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(5,16,66,.28)_0,rgba(5,16,66,0)_96px)]" />
          <div className="absolute inset-x-4 flex justify-between" style={{ top: "calc(var(--safe-top) + var(--strip-h) + 8px)" }}>
            <BackButton fallback="/" slideBack />
            {university && <SaveButton slug={slug} name={university.name} />}
          </div>
        </div>

        <section
          className="relative -mt-6 rounded-t-sheet bg-surface shadow-[0_-8px_24px_rgba(5,16,66,.06)]"
          style={{ paddingBottom: "calc(var(--safe-bottom) + 24px)" }}
        >
          {university ? (
            <>
              <h1 className="px-6 pt-6 text-navy-900 type-title-1">{university.name}</h1>
              <p className="mt-1 flex items-center px-6 text-slate-600 type-body-lg">
                {university.type && (
                  <span>
                    {university.type}
                    {university.city && <span className="sr-only">,</span>}
                  </span>
                )}
                {university.type && university.city && <span aria-hidden className="mx-2 size-1 shrink-0 rounded-full bg-slate-600" />}
                {university.city && <span>{university.city}</span>}
              </p>

              <div className="mt-4 px-2">
                <UnderlineTabs tabs={TABS} value={tab} onChange={changeTab} aria-label={`${university.name} sections`} />
              </div>

              <div role="tabpanel" aria-label={TABS.find((t) => t.id === tab)?.label}>
                {tab === "requirements" ? (
                  <>
                    <h2 className="mt-6 px-6 text-navy-900 type-title-2">Transfer requirements</h2>
                    {children}
                  </>
                ) : (
                  <EmptyState
                    icon={<BarricadeIcon weight="fill" size={32} />}
                    title="This part isn't built yet"
                    body="It's on the list. Your plan is still on the home screen."
                    action={<TintedButton href="/">Back to home</TintedButton>}
                  />
                )}
              </div>
            </>
          ) : (
            <div className="px-4 pt-6">
              <LoadError onRetry={onRetry} />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

// 03 → Load failure
export function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <InlineError
      title="Couldn't load requirements"
      body="Check your connection, then try again."
      action={<TintedButton onClick={onRetry}>Try again</TintedButton>}
    />
  );
}
