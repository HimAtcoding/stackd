import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type SectionBandProps = {
  title: string;
  subtitle: string;
  // A pushed screen's back button. A tab has none.
  back?: ReactNode;
  // What sits at the bottom of the band: the search field, or the tabs
  children?: ReactNode;
  // The section's color: Explore's mint (21), or Opportunities' yellow (22)
  tone?: "mint" | "yellow";
};

// A quiet band in the section's color, from the physical top across the whole width (21). The screen's root needs
// overflow-x-clip above 480 wide, where the band runs past the column.
export function SectionBand({ title, subtitle, back, children, tone = "mint" }: SectionBandProps) {
  return (
    <header className="relative" style={{ paddingTop: `calc(var(--safe-top) + var(--strip-h) + ${back ? 8 : 24}px)` }}>
      <span aria-hidden className={cn("absolute inset-y-0 inset-x-[calc(50%-50vw)]", tone === "yellow" ? "bg-yellow-50" : "bg-mint-100")} />
      {back && <div className="relative px-4">{back}</div>}
      <h1 className={cn("relative px-6 text-navy-900 type-title-1", back ? "mt-6" : null)}>{title}</h1>
      <p className={cn("relative px-6 text-slate-700 type-body", back ? "mt-1" : "mt-2")}>{subtitle}</p>
      {children && <div className="relative">{children}</div>}
    </header>
  );
}
