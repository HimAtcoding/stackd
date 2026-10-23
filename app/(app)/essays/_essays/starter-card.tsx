"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowsClockwiseIcon, PencilSimpleLineIcon } from "@phosphor-icons/react/ssr";
import type { Starter } from "@/lib/piq-starters";

// The question text crossfades this long on Try another (20 → Starter card)
const FADE_S = 0.16;

type StarterCardProps = {
  starter: Starter;
  total: number;
  onTryAnother: () => void;
  onAnswer: () => void;
};

// The empty answer's one bold thing (20 → 2): a starter question from UC's guidance, Try another, and Answer in notes
export function StarterCard({ starter, total, onTryAnother, onAnswer }: StarterCardProps) {
  const still = useReducedMotion();
  return (
    <section
      aria-label="Starter question"
      className="rounded-lg bg-indigo-600 p-5 shadow-lift [&_button:focus-visible]:outline-white"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-white/85 type-label">Start with a question</p>
        <button
          type="button"
          onClick={onTryAnother}
          aria-label="Try another question"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/16 text-white transition-transform duration-120 ease-out motion-safe:pressed:scale-[0.94]"
        >
          <ArrowsClockwiseIcon weight="bold" size={20} aria-hidden />
        </button>
      </div>
      <div aria-live="polite" className="mt-3 grid">
        {still ? (
          <p className="line-clamp-4 text-white type-title-2">{starter.text}</p>
        ) : (
          <AnimatePresence initial={false}>
            <motion.p
              key={starter.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: FADE_S, ease: "linear" }}
              className="line-clamp-4 text-white type-title-2 [grid-area:1/1]"
            >
              {starter.text}
            </motion.p>
          </AnimatePresence>
        )}
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onAnswer}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-indigo-600 type-label transition-colors duration-120 ease-out pressed:bg-tint-indigo"
        >
          <PencilSimpleLineIcon weight="bold" size={18} aria-hidden />
          Answer in notes
        </button>
        {/* Numbered because the starters follow the order of UC's guidance */}
        <span className="text-white/85 tabular-nums type-caption">
          {starter.n} of {total}
        </span>
      </div>
    </section>
  );
}
