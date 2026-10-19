import Link from "next/link";
import { TextLink } from "@/components/ui/text-link";
import type { Plan, PlanTarget } from "@/lib/data/plan";
import { universityHref } from "@/lib/features";
import { majorWithDegree } from "@/lib/format";

// The major under the school's name. No major: "Pick a major", or "Major not listed yet" when the student chose that.
function majorLine(target: PlanTarget) {
  if (!target.majorName) return target.majorNotListed ? "Major not listed yet" : "Pick a major";
  return majorWithDegree(target.majorName, target.degreeType);
}

// The plan as a two-stop route, the student's college to their first school (15 → Route). Tier 2. The dashed line
// is a trip not made yet. The whole route opens the first school's requirements; Edit is its own link on top.
export function PlanRoute({ plan }: { plan: Plan }) {
  const [first, ...rest] = plan.targets;
  const from = plan.home?.name ?? "Your community college";
  const major = majorLine(first);
  // "…Computer Science B.S. Opens…": a degree already ends the sentence
  const sentence = major.endsWith(".") ? major : `${major}.`;

  return (
    <div className="relative rounded-md border border-border bg-surface">
      <Link
        href={universityHref(first.slug)}
        transitionTypes={["push"]}
        aria-label={`Your plan: ${from} to ${first.name}, ${sentence} Opens ${first.name} requirements.`}
        className="absolute inset-0 rounded-md transition-colors duration-200 ease-out pressed:bg-surface-pressed pressed:duration-120"
      />
      <div className="pointer-events-none relative flex p-4">
        {/* From node centered on the 20 tall from row, a 16 dashed connector, then the to node on the school's name */}
        <span aria-hidden className="relative w-4 shrink-0">
          <span className="absolute left-1/2 top-[5px] size-2.5 -translate-x-1/2 rounded-full border-2 border-slate-400 bg-surface" />
          <span className="absolute left-1/2 top-[15px] h-4 w-0.5 -translate-x-1/2 bg-[repeating-linear-gradient(to_bottom,var(--border-strong)_0_3px,transparent_3px_6px)]" />
          <span className="absolute left-1/2 top-[31px] size-3 -translate-x-1/2 rounded-full bg-blue-600" />
        </span>
        <div className="ml-3 min-w-0 flex-1">
          <div className="flex h-5 items-center justify-between gap-3">
            <p className="min-w-0 truncate text-slate-600 type-body">{from}</p>
            <TextLink href="/settings/" transitionTypes={["push"]} size="label" aria-label="Edit your plan" className="pointer-events-auto -mx-2.5 shrink-0 px-2.5">
              Edit
            </TextLink>
          </div>
          <p className="mt-1.5 text-navy-900 type-headline">{first.name}</p>
          <p className="mt-0.5 text-slate-600 type-caption">{major}</p>
          {rest.length > 0 && <p className="text-slate-600 tabular-nums type-caption">and {rest.length} more</p>}
        </div>
      </div>
    </div>
  );
}
