import { LinkLine } from "./link-line";

type SourceBlockProps = {
  // "From UC Admissions, Computer science Transfer Pathway. Checked Oct 31, 2026."
  line: string;
  // detail: the line under the label; "" when the label is already the domain (22 → 6)
  link: { href: string; label: string; detail?: string };
  // A mailto with what the report is about
  report: string;
  className?: string;
};

// Where a list of facts came from, when a person checked it, and how to say it's wrong (21 → Source block).
// Goes under every list of facts.
export function SourceBlock({ line, link, report, className }: SourceBlockProps) {
  return (
    <section aria-label="Source" className={className}>
      <p className="text-slate-600 tabular-nums type-caption">{line}</p>
      <LinkLine href={link.href} label={link.label} detail={link.detail} className="mt-2" />
      <a href={report} className="mt-1 block w-fit py-3.5 text-blue-700 type-caption pressed:underline focus-ring:underline">
        Report a problem
      </a>
    </section>
  );
}
