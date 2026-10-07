import Link from "next/link";
import { TextLink } from "@/components/ui/text-link";
import type { Plan, PlanTarget } from "@/lib/data/plan";
import { majorWithDegree } from "@/lib/format";

const SHOWN = 3;

// "{major} from {college}" under a school's name. No college: just the major.
// No major: "Pick a major" when none was picked, "Major not listed yet" when the student chose "Not listed yet".
function pathLine(target: PlanTarget, college: string | undefined) {
  if (!target.majorName) return target.majorNotListed ? "Major not listed yet" : "Pick a major";
  const major = majorWithDegree(target.majorName, target.degreeType);
  return college ? `${major} from ${college}` : major;
}

// The student's schools, in the order they chose them (02 → Plan card). The whole card opens the first school;
// "Edit" is its own link, on top of the card's.
export function PlanCard({ plan }: { plan: Plan }) {
  const [first] = plan.targets;
  const shown = plan.targets.slice(0, SHOWN);
  const more = plan.targets.length - shown.length;
  const college = plan.home?.name;

  return (
    <div className="relative rounded-lg bg-surface shadow-card">
      <Link
        href={`/university/?slug=${first.slug}&tab=requirements`}
        transitionTypes={["push"]}
        aria-label={`Your plan, ${plan.targets.map((t) => `${t.name}, ${pathLine(t, college)}`).join(", ")}`}
        className="absolute inset-0 rounded-lg transition-colors duration-200 ease-out pressed:bg-surface-pressed pressed:duration-120"
      />
      <div className="pointer-events-none relative p-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-navy-900 type-title-2">Your plan</h2>
          <TextLink href="/settings/" transitionTypes={["push"]} size="label" aria-label="Edit your plan" className="pointer-events-auto -mx-2.5 px-2.5">
            Edit
          </TextLink>
        </div>
        <ul className="mt-3 flex flex-col gap-2">
          {shown.map((t) => (
            <li key={t.institutionId}>
              <p className="text-navy-900 type-headline">{t.name}</p>
              <p className="mt-0.5 text-slate-600 type-caption">{pathLine(t, college)}</p>
            </li>
          ))}
        </ul>
        {more > 0 && <p className="mt-2 text-slate-600 tabular-nums type-caption">+{more} more</p>}
      </div>
    </div>
  );
}
