import type { Icon } from "@phosphor-icons/react";
import {
  BookOpenTextIcon,
  CheckSquareIcon,
  ListChecksIcon,
  MapPinLineIcon,
  PaperPlaneTiltIcon,
  PencilLineIcon,
  ReceiptIcon,
  TrophyIcon,
} from "@phosphor-icons/react/ssr";
import { stepSlug } from "./deadlines";

// Each checklist step's icon tile (16 → Step icons), keyed in code by a slug made from the step's title, so the
// database and its verified rows don't change. A step not in the map gets the default.

export type StepLook = { icon: Icon; tile: string; color: string };

const SKY = { tile: "bg-tint-sky", color: "text-blue-600" };
const MINT = { tile: "bg-mint-100", color: "text-mint-600" };
const INDIGO = { tile: "bg-tint-indigo", color: "text-indigo-600" };
const AMBER = { tile: "bg-amber-50", color: "text-amber-700" };

const LOOKS: Record<string, StepLook> = {
  "pick-your-campuses-and-majors": { icon: MapPinLineIcon, ...SKY },
  "enter-your-courses-and-grades": { icon: BookOpenTextIcon, ...MINT },
  "write-your-personal-insight-answers": { icon: PencilLineIcon, ...INDIGO },
  "add-activities-and-awards": { icon: TrophyIcon, ...AMBER },
  "check-for-extra-campus-steps": { icon: ListChecksIcon, ...INDIGO },
  "pay-the-fee-or-ask-for-a-waiver": { icon: ReceiptIcon, ...SKY },
};

// The goal, and the only solid tile. Matched by its start, since the date in its title changes with the cycle.
const SUBMIT: StepLook = { icon: PaperPlaneTiltIcon, tile: "bg-blue-600", color: "text-white" };
const DEFAULT: StepLook = { icon: CheckSquareIcon, ...SKY };

export { stepSlug };

export function stepLook(title: string): StepLook {
  const slug = stepSlug(title);
  if (slug.startsWith("submit-by")) return SUBMIT;
  return LOOKS[slug] ?? DEFAULT;
}
