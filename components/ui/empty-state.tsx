import type { ReactNode } from "react";

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  body: string;
  action: ReactNode;
  // h1 when the empty state is the whole screen.
  headingLevel?: 1 | 2;
  // Space above the icon, when the screen sets it (the placeholder uses 120).
  top?: number;
};

// Also the placeholder for every screen that isn't drawn yet.
export function EmptyState({ icon, title, body, action, headingLevel = 2, top }: EmptyStateProps) {
  const Heading = headingLevel === 1 ? "h1" : "h2";
  return (
    <div className="mx-auto flex max-w-[280px] flex-col items-center py-12 text-center" style={top === undefined ? undefined : { paddingTop: top }}>
      <span aria-hidden className="flex size-18 items-center justify-center rounded-full bg-tint-sky text-blue-600">
        {icon}
      </span>
      <Heading className="mt-4 text-navy-900 type-title-3">{title}</Heading>
      <p className="mt-2 text-slate-600 type-body">{body}</p>
      <div className="mt-5 w-full">{action}</div>
    </div>
  );
}
