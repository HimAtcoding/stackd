"use client";

import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { PLAZA_LINE, welcomeLayout, type WelcomeRatios } from "./welcome-layout";
import styles from "./welcome.module.css";

type WelcomeFrameProps = {
  ratios: WelcomeRatios;
  scene: ReactNode;
  text: ReactNode;
  art: ReactNode;
  cta: ReactNode;
};

// Measures the CTA, the text and the viewport, then places the scene and sizes the husky.
// Runs again on resize, rotation, and when Safari's bars show or hide.
function useWelcomeLayout({ scene, husky, books }: WelcomeRatios) {
  const root = useRef<HTMLElement>(null);
  const text = useRef<HTMLDivElement>(null);
  const cta = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = root.current;
    const textEl = text.current;
    const ctaEl = cta.current;
    if (!el || !textEl || !ctaEl) return;

    const update = () => {
      const { sceneTop, sceneHeight, huskyHeight } = welcomeLayout(
        {
          vw: document.documentElement.clientWidth,
          vh: window.innerHeight,
          ctaTop: ctaEl.getBoundingClientRect().top + window.scrollY,
          textBottom: textEl.getBoundingClientRect().bottom + window.scrollY,
        },
        { scene, husky, books },
      );
      el.style.setProperty("--scene-top", `${sceneTop}px`);
      el.style.setProperty("--scene-h", `${sceneHeight}px`);
      el.style.setProperty("--husky-h", `${huskyHeight}px`);
      el.toggleAttribute("data-husky-hidden", huskyHeight === 0);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    observer.observe(textEl);
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    window.visualViewport?.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      window.visualViewport?.removeEventListener("resize", update);
    };
  }, [scene, husky, books]);

  return { rootRef: root, textRef: text, ctaRef: cta };
}

export function WelcomeFrame({ ratios, scene, text, art, cta }: WelcomeFrameProps) {
  const { rootRef, textRef, ctaRef } = useWelcomeLayout(ratios);

  return (
    <main
      ref={rootRef}
      className="relative mx-auto flex h-dvh min-h-fit max-w-[480px] flex-col bg-sky-100"
      style={{ "--scene-ratio": ratios.scene, "--plaza": PLAZA_LINE } as CSSProperties}
    >
      <div className={styles.scene}>{scene}</div>
      <div aria-hidden className={`${styles.scrim} fixed inset-x-0 bottom-0`} />

      <div className="relative flex flex-1 flex-col" style={{ paddingBottom: "calc(var(--safe-bottom) + 12px)" }}>
        <div ref={textRef} className={`${styles.top} flex flex-col items-center px-6 text-center`}>
          <div aria-hidden className={styles.skyScrim} />
          {text}
        </div>

        <div className={`${styles.zone} relative mt-2 min-h-0 flex-1`}>{art}</div>

        {/* Husky line to CTA top: 24 to the ground line, then 16 to the button */}
        <div aria-hidden className="h-10 shrink-0" />

        <div ref={ctaRef} className="px-4">
          {cta}
        </div>
      </div>
    </main>
  );
}
