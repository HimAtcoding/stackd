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

// The letters' size by how many there are, so the widest of each length fits the 40 tile in Figtree 800 (measured:
// "MTSAC" is 46 wide at 13 and 36 at 10). 22 asks for 13 at 4 to 5 letters, which overflows, and for 32 tiles in
// compact rows, which can't hold 3 letters at 15; every tile is 40 instead.
const LETTERS: Record<number, string> = { 4: "text-[11px]", 5: "text-[10px]" };

// A school's monogram tile: its own short name ("UCSD", "SJSU", "LPC") in white on its system's color. Never a logo,
// seal or mascot. Hidden from screen readers; the row's name carries the school. Nothing without an abbreviation,
// and nothing while Explore's flag is off.
export function SchoolTile({ abbreviation, system, className }: SchoolTileProps) {
  if (!FEATURES.explore || !abbreviation) return null;
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-sm font-extrabold leading-none tracking-normal text-white",
        "size-10",
        LETTERS[abbreviation.length] ?? "text-[15px]",
        FILL[system?.toUpperCase() ?? ""] ?? "bg-slate-700",
        className,
      )}
    >
      {abbreviation}
    </span>
  );
}
