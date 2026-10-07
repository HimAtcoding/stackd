import type { ReactNode } from "react";

// A bottom area that stays in view while the page scrolls, with a 24 fade above it so rows don't end abruptly
// behind it (10 → Continue button). The content before it needs 24 of bottom padding to clear the fade.
export function PinnedBottom({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 bg-sky-50 px-4 pt-4" style={{ paddingBottom: "calc(16px + var(--safe-bottom))" }}>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-full h-6 bg-[linear-gradient(180deg,transparent,var(--sky-50))]" />
      {children}
    </div>
  );
}
