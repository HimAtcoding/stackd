"use client";

import { useAnimate, useReducedMotion } from "motion/react";
import { HeartIcon } from "@phosphor-icons/react/ssr";
import { CircleButton } from "@/components/ui/circle-button";
import { toggleSaved, useSaved } from "@/lib/saved";

// Heart circle. Saving pops the icon 1 → 1.2 → 1 on the bouncy spring.
export function SaveButton({ slug, name }: { slug: string; name: string }) {
  const saved = useSaved(slug);
  const [scope, animate] = useAnimate<HTMLSpanElement>();
  const reduceMotion = useReducedMotion();

  return (
    <CircleButton
      aria-label={`Save ${name}`}
      aria-pressed={saved}
      onClick={() => {
        toggleSaved(slug);
        if (saved || reduceMotion) return;
        animate(scope.current, { scale: 1.2 }, { duration: 0.1, ease: "easeOut" }).then(() =>
          animate(scope.current, { scale: 1 }, { type: "spring", stiffness: 260, damping: 16 }),
        );
      }}
      icon={
        <span ref={scope} className="flex">
          {saved ? <HeartIcon weight="fill" size={22} className="text-coral-500" /> : <HeartIcon size={22} />}
        </span>
      }
    />
  );
}
