"use client";

import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { CircleButton } from "./ui/circle-button";

type NavigationWithBack = { canGoBack?: boolean };

// True when Back stays inside the app's history.
function canGoBack() {
  const nav = (window as Window & { navigation?: NavigationWithBack }).navigation;
  if (nav && typeof nav.canGoBack === "boolean") return nav.canGoBack;
  return window.history.length > 1;
}

type BackButtonProps = {
  // Where to go when there's no history to go back to.
  fallback: string;
  // Replaces history back, e.g. to leave a second state on the same route.
  onBack?: () => void;
  // On a pushed screen: history back plays the reverse slide (00 → Motion).
  slideBack?: boolean;
};

// History back runs outside React's view transitions, so Back starts one itself and waits for the popstate.
function backWithSlide(back: () => void) {
  if (!("startViewTransition" in document)) return back();
  const html = document.documentElement;
  html.dataset.nav = "back";
  const transition = document.startViewTransition(
    () =>
      new Promise<void>((resolve) => {
        window.addEventListener("popstate", () => requestAnimationFrame(() => resolve()), { once: true });
        setTimeout(resolve, 500);
        back();
      }),
  );
  transition.finished.finally(() => delete html.dataset.nav);
}

// Circle back button, 8 below the demo strip, 16 from the left.
export function BackButton({ fallback, onBack, slideBack }: BackButtonProps) {
  const router = useRouter();
  return (
    <CircleButton
      aria-label="Back"
      icon={<ArrowLeftIcon weight="bold" size={22} />}
      onClick={() => {
        if (onBack) onBack();
        else if (canGoBack()) {
          if (slideBack) backWithSlide(() => router.back());
          else router.back();
        }
        else router.replace(fallback);
      }}
    />
  );
}
