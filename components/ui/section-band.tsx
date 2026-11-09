import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type SectionBandProps = {
  title: string;
  subtitle: string;
  // A pushed screen's back button. A tab has none.
  back?: ReactNode;
  // What sits at the bottom of the band: the search field, or the tabs
  children?: ReactNode;
};

// The top of a tab or pushed screen: title and subtitle on the white page (00 rev 2 → Section band). The section's
// color lives in its hero instead.
export function SectionBand({ title, subtitle, back, children }: SectionBandProps) {
  return (
    <header className="relative" style={{ paddingTop: `calc(var(--safe-top) + var(--strip-h) + ${back ? 8 : 24}px)` }}>
      {back && <div className="relative px-4">{back}</div>}
      <h1 className={cn("relative px-6 text-navy-900 type-title-1", back ? "mt-6" : null)}>{title}</h1>
      <p className={cn("relative px-6 text-slate-600 type-body", back ? "mt-1" : "mt-2")}>{subtitle}</p>
      {children && <div className="relative">{children}</div>}
    </header>
  );
}
