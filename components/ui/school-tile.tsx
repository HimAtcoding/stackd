import { cn } from "@/lib/cn";
import { FEATURES } from "@/lib/features";

// The fill says which system the school is in (22 → 2)
const FILL: Record<string, string> = { UC: "bg-blue-700", CSU: "bg-amber-800" };

type SchoolTileProps = {
  abbreviation: string | null | undefined;
  // institutions.system: UC, CSU or CCC
  system: string | null | undefined;
  className?: string;
};

// 48 wide and 40 tall everywhere, so names line up in every list. 15 for 2 to 3 letters, 12 for 4 to 5: the widest
// ("CSUMB", 44 at 12) fits the 48 (22 → 2).
const LETTERS: Record<number, string> = { 4: "text-[12px]", 5: "text-[12px]" };

// A school's monogram tile: its own short name ("UCSD", "SJSU", "LPC") in white on its system's color. Never a logo,
// seal or mascot. Hidden from screen readers; the row's name carries the school. Nothing without an abbreviation,
// and nothing while Explore's flag is off.
export function SchoolTile({ abbreviation, system, className }: SchoolTileProps) {
  if (!FEATURES.explore || !abbreviation) return null;
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-sm font-black leading-none tracking-normal text-white",
        "h-10 w-12",
        LETTERS[abbreviation.length] ?? "text-[15px]",
        FILL[system?.toUpperCase() ?? ""] ?? "bg-slate-700",
        className,
      )}
    >
      {abbreviation}
    </span>
  );
}
