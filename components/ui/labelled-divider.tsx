// Two rules with a centered label. Decorative.
export function LabelledDivider({ label }: { label: string }) {
  return (
    <div aria-hidden="true" className="flex h-6 items-center gap-4">
      <span className="h-0.5 flex-1 bg-border" />
      <span className="text-slate-600 type-body">{label}</span>
      <span className="h-0.5 flex-1 bg-border" />
    </div>
  );
}
