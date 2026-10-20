"use client";

import { CheckIcon } from "@phosphor-icons/react/ssr";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { LinkLine } from "@/components/ui/link-line";
import { StepIconTile } from "@/components/ui/step-tile";
import { signalLabel, stepSlug, type ChecklistView } from "@/lib/deadlines";
import { essaysHref } from "@/lib/features";
import { stepNeeds } from "@/lib/step-content";
import { stepLook } from "@/lib/step-icons";

type StepLink = { href: string; label: string; detail?: string };

// Where Stackd can do the step itself (18 → Do it in Stackd). Other steps have no link.
function stepLink(c: ChecklistView, title: string): StepLink | null {
  const slug = stepSlug(title);
  if (slug === "pick-your-campuses-and-majors") return { href: "/settings/", label: "See your plan", detail: "Your schools" };
  if (slug === "write-your-personal-insight-answers") {
    // Only with Essays on, and only on UC's checklist: the answers are for UC applications (17 → Entry points)
    const href = c.deadline.audience === "uc" ? essaysHref() : null;
    return href ? { href, label: "Write them in Stackd", detail: "Personal insight answers" } : null;
  }
  if (slug.startsWith("submit-by")) return { href: c.checklist.apply_url, label: c.checklist.apply_label };
  return null;
}

type StepSheetProps = {
  open: boolean;
  onClose: () => void;
  checklist: ChecklistView;
  // Kept while the sheet slides away, so it doesn't empty as it closes
  stepId: string | null;
  onToggle: (stepId: string, done: boolean) => void;
};

// One step in full: what it is, what you'll need, where to do it in Stackd, and Mark done (18 → Step sheets)
export function StepSheet({ open, onClose, checklist: c, stepId, onToggle }: StepSheetProps) {
  const at = c.steps.findIndex((s) => s.step.id === stepId);
  const entry = at >= 0 ? c.steps[at] : null;

  return (
    <BottomSheet open={open && entry !== null} onClose={onClose} labelledBy="step-sheet-title">
      {entry && <Content c={c} entry={entry} position={at + 1} onToggle={onToggle} />}
    </BottomSheet>
  );
}

function Content({
  c,
  entry: { step, done, auto },
  position,
  onToggle,
}: {
  c: ChecklistView;
  entry: ChecklistView["steps"][number];
  position: number;
  onToggle: (stepId: string, done: boolean) => void;
}) {
  const needs = stepNeeds(c.deadline.audience, step.title);
  const link = stepLink(c, step.title);
  const LinkIcon = stepLook(step.title).icon;

  return (
    <div className="-mx-6 -mt-6 max-h-[calc(100dvh-var(--safe-top)-72px)] overflow-y-auto px-6 pt-6">
      <div className="flex items-start gap-3">
        <StepIconTile title={step.title} done={done} />
        <div className="min-w-0 flex-1">
          <h2 id="step-sheet-title" tabIndex={-1} className="line-clamp-2 text-navy-900 type-title-2 focus:outline-none">
            {step.title}
          </h2>
          {auto && <p className="mt-0.5 text-slate-600 type-caption">{signalLabel(auto)}</p>}
        </div>
      </div>
      <p className="mt-2 text-slate-700 type-body">{step.summary}</p>

      {needs.length > 0 && (
        <>
          <h3 className="mt-5 text-navy-900 type-headline">What you&apos;ll need</h3>
          <ul className="mt-2 flex flex-col gap-2">
            {needs.map((item) => (
              <li key={item} className="flex gap-3 text-navy-900 type-body">
                <span aria-hidden className="mt-[7px] size-1.5 shrink-0 rounded-full bg-slate-400" />
                {item}
              </li>
            ))}
          </ul>
        </>
      )}

      {/* The link's 4 padding counts toward the 24 above it */}
      {link && <LinkLine {...link} icon={<LinkIcon weight="bold" size={16} />} className="mt-5" />}

      <div className={link ? "mt-5" : "mt-6"}>
        {done ? (
          <button
            type="button"
            onClick={() => onToggle(step.id, false)}
            className="flex h-12 w-full items-center justify-center rounded-full text-blue-700 type-label pressed:underline focus-ring:underline"
          >
            Mark not done
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onToggle(step.id, true)}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-blue-600 text-white type-button transition-[background-color,transform] duration-200 ease-out pressed:bg-blue-700 pressed:duration-120 motion-safe:pressed:scale-[0.98]"
          >
            <CheckIcon weight="bold" size={20} aria-hidden />
            Mark done
          </button>
        )}
      </div>
      <p className="mt-2 text-center text-slate-600 tabular-nums type-caption">
        Step {position} of {c.steps.length}
      </p>
    </div>
  );
}
