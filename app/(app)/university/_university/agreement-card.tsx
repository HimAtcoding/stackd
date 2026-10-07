import { ArrowSquareOutIcon, FileTextIcon } from "@phosphor-icons/react/ssr";
import { Card } from "@/components/ui/card";
import { TintedButton } from "@/components/ui/tinted-button";
import type { AgreementLink } from "@/lib/data/university";

// Where "Open ASSIST" goes when there's no agreement link for the student's path
const ASSIST_HOME = "https://assist.org";

type AgreementCardProps = {
  // Null when the database has no link for this college, school and major
  link: AgreementLink | null;
  // The student's home college, named in the body. Only used with a link.
  college: string | null;
};

// The official agreement for the student's path (03 → Real accounts). Stackd links to it; it never copies it.
// The year under the button is the source-and-year label docs/06 asks for.
export function AgreementCard({ link, college }: AgreementCardProps) {
  return (
    <Card className="mx-4 mt-4">
      <div className="flex items-start gap-4">
        <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-sm bg-tint-sky text-blue-600">
          <FileTextIcon weight="fill" size={24} />
        </span>
        <div className="min-w-0">
          <h3 className="text-navy-900 type-headline">Your official agreement</h3>
          <p className="mt-1 text-slate-600 type-body">
            {link && college
              ? `ASSIST lists which ${college} courses count for this major. Stackd can't show them here yet.`
              : "We don't have an official agreement link for your path yet."}
          </p>
        </div>
      </div>
      <TintedButton
        external
        href={link ? link.url : ASSIST_HOME}
        aria-label={`${link ? "Open on ASSIST" : "Open ASSIST"}, opens outside Stackd`}
        icon={<ArrowSquareOutIcon weight="bold" size={20} aria-hidden />}
        className="mt-4"
      >
        {link ? "Open on ASSIST" : "Open ASSIST"}
      </TintedButton>
      {link && <p className="mt-2 text-slate-600 tabular-nums type-caption">{link.academicYear} agreement. Opens assist.org.</p>}
    </Card>
  );
}
