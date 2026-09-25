import { ViewTransition, type ReactNode } from "react";

// Crossfades a page only when the navigation is tagged "crossfade" (Welcome → Create account, Sign in → Home).
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter={{ crossfade: "auto", default: "none" }} exit={{ crossfade: "auto", default: "none" }} default="none">
      {children}
    </ViewTransition>
  );
}
