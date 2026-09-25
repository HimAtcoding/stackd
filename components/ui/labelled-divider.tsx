// Two rules with a centered label. Decorative.
export function LabelledDivider({ label }: { label: string }) {
  return (
    <div aria-hidden="true" className="flex h-6 items-center gap-4">
      <span className="h-px flex-1 bg-border-strong" />
      <span className="text-slate-600 type-body">{label}</span>
      <span className="h-px flex-1 bg-border-strong" />
    </div>
  );
}
