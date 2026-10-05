import { ViewTransition, type ReactNode } from "react";

// "crossfade": Welcome → Create account, Sign in → Home. "push": Home → University.
// Back from a pushed screen is animated by BackButton itself; everything else is instant.
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition
      enter={{ crossfade: "auto", push: "push-in", default: "none" }}
      exit={{ crossfade: "auto", push: "push-out", default: "none" }}
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
