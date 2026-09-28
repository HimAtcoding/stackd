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
};

// Circle back button, 8 below the demo strip, 16 from the left.
export function BackButton({ fallback, onBack }: BackButtonProps) {
  const router = useRouter();
  return (
    <CircleButton
      aria-label="Back"
      icon={<ArrowLeftIcon weight="bold" size={22} />}
      onClick={() => {
        if (onBack) onBack();
        else if (canGoBack()) router.back();
        else router.replace(fallback);
      }}
    />
  );
}
