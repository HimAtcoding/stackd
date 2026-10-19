import { ArrowSquareOutIcon, GlobeIcon } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/cn";

type OutsideLinkRowProps = {
  href: string;
  // "Open the UC application", "Open the official page"
  title: string;
  className?: string;
};

// "apply.universityofcalifornia.edu". A leading "www." says nothing, so it's left off.
const domainOf = (href: string) => {
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return href;
  }
};

// A link that leaves Stackd (16 → Outside-link row): a tier 2 row with a globe tile, the title and the site's
// domain, and the outside-link arrow. The whole row is the link, and its name says it opens outside the app.
export function OutsideLinkRow({ href, title, className }: OutsideLinkRowProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      aria-label={`${title}, opens outside the app`}
      className={cn(
        "flex min-h-16 items-center gap-3 rounded-md border border-border bg-surface px-4 transition-colors duration-200 ease-out pressed:bg-surface-pressed pressed:duration-120",
        className,
      )}
    >
      <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-tint-sky text-blue-600">
        <GlobeIcon size={20} />
      </span>
      <span aria-hidden className="min-w-0 flex-1 py-3">
        <span className="block text-navy-900 type-row-title">{title}</span>
        <span className="mt-0.5 block truncate text-slate-600 type-caption">{domainOf(href)}</span>
      </span>
      <ArrowSquareOutIcon aria-hidden size={20} className="shrink-0 text-slate-600" />
    </a>
  );
}
