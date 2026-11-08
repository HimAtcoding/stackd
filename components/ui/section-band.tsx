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

// A quiet band in the section's color, from the physical top across the whole width (21). The screen's root needs
// overflow-x-clip above 480 wide, where the band runs past the column.
export function SectionBand({ title, subtitle, back, children }: SectionBandProps) {
  return (
    <header className="relative" style={{ paddingTop: `calc(var(--safe-top) + var(--strip-h) + ${back ? 8 : 24}px)` }}>
      <span aria-hidden className="absolute inset-y-0 left-1/2 w-screen -translate-x-1/2 bg-mint-100" />
      {back && <div className="relative px-4">{back}</div>}
      <h1 className={cn("relative px-6 text-navy-900 type-title-1", back ? "mt-6" : null)}>{title}</h1>
      <p className={cn("relative px-6 text-slate-700 type-body", back ? "mt-1" : "mt-2")}>{subtitle}</p>
      {children && <div className="relative">{children}</div>}
    </header>
  );
}
