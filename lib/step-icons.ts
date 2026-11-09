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
import type { Tone } from "@/components/ui/icon-circle";
import { stepSlug } from "./deadlines";

// Each checklist step's icon circle (23 → Step icons), keyed in code by a slug made from the step's title, so the
// database and its verified rows don't change. A step not in the map gets the default.

export type StepLook = { icon: Icon; tone: Tone };

const LOOKS: Record<string, StepLook> = {
  "pick-your-campuses-and-majors": { icon: MapPinLineIcon, tone: "blue" },
  "enter-your-courses-and-grades": { icon: BookOpenTextIcon, tone: "green" },
  "write-your-personal-insight-answers": { icon: PencilLineIcon, tone: "indigo" },
  "add-activities-and-awards": { icon: TrophyIcon, tone: "amber" },
  "check-for-extra-campus-steps": { icon: ListChecksIcon, tone: "indigo" },
  "pay-the-fee-or-ask-for-a-waiver": { icon: ReceiptIcon, tone: "blue" },
};

// Submit is matched by its start, since the date in its title changes with the cycle
const SUBMIT: StepLook = { icon: PaperPlaneTiltIcon, tone: "blue" };
const DEFAULT: StepLook = { icon: CheckSquareIcon, tone: "blue" };

export { stepSlug };

export function stepLook(title: string): StepLook {
  const slug = stepSlug(title);
  if (slug.startsWith("submit-by")) return SUBMIT;
  return LOOKS[slug] ?? DEFAULT;
}
