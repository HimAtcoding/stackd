"use client";

import { useEssaysDone } from "@/lib/data/essays";
import { useUnreadComments } from "@/lib/data/reviews";
import { isEssaysStep, signalLabel, type ChecklistView } from "@/lib/deadlines";
import { essaysHref } from "@/lib/features";
import { essaysStepCaption } from "@/lib/review";

type StepEntry = ChecklistView["steps"][number];

// The caption under a step's title on Home, in the steps sheet and in the step sheet. With Essays on, UC's writing
// step tells how far Essays is (lib/review.ts → essaysStepCaption). Other steps say what checked them, if anything
// did ("From your plan").
export function useStepCaption(checklist: ChecklistView | null, term: string | null): (entry: StepEntry) => string | null {
  const done = useEssaysDone(term);
  const unread = useUnreadComments();
  const essaysOn = Boolean(essaysHref()) && done !== null && checklist?.deadline.audience === "uc";
  return ({ step, auto }) => {
    if (essaysOn && done !== null && isEssaysStep(step.title)) return essaysStepCaption({ done, unread, checkedByEssays: auto === "essays" });
    return auto ? signalLabel(auto) : null;
  };
}
