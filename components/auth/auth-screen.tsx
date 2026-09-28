import type { ReactNode } from "react";
import { Art } from "@/components/art";
import { PageTransition } from "@/components/page-transition";
import styles from "./auth.module.css";

type AuthScreenProps = {
  children: ReactNode;
  // Sign in and Create account show the cloud band; Forgot password doesn't.
  clouds?: boolean;
};

// Shared background for the three auth screens: --sky-100 → --sky-50 over 320, then --sky-50.
export function AuthScreen({ children, clouds }: AuthScreenProps) {
  return (
    <PageTransition>
      <main className={`${styles.screen} relative mx-auto flex min-h-dvh max-w-[480px] flex-col`}>
        {clouds && (
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[300px]">
            <Art id="home-clouds" fill optional className="object-cover" />
          </div>
        )}
        {children}
      </main>
    </PageTransition>
  );
}

type AuthTopProps = {
  headline: string;
  subtitle: string;
  // 160 on Sign in so it breaks after "journey"; 180 on Create account so it's two lines.
  subtitleMaxWidth?: number;
};

// Wordmark, headline, subtitle and the waving husky (06 → Top block).
export function AuthTop({ headline, subtitle, subtitleMaxWidth = 160 }: AuthTopProps) {
  return (
    <div className="relative px-6 pb-5" style={{ paddingTop: "calc(var(--safe-top) + var(--strip-h) + 12px)" }}>
      <Art id="wordmark" width={100} height={28} label="Stackd" preload />
      <h1 className="relative z-[1] mt-6 max-w-[190px] text-navy-900 type-display">{headline}</h1>
      <p className="relative z-[1] mt-2 text-navy-900 type-body-md" style={{ maxWidth: subtitleMaxWidth }}>
        {subtitle}
      </p>

      {/* Behind the text, with its cut edge 4 under the sheet's top */}
      <div className={`${styles.husky} absolute right-4 -bottom-1`}>
        <Art
          id="husky-wave"
          width={176}
          height={186}
          preload
          reveal
          style={{ width: "var(--husky-w)", height: "auto", aspectRatio: "176 / 186" }}
        />
      </div>
    </div>
  );
}

// Provider logos, rendered on the server so the art check can read /public.
export function providerLogos() {
  return {
    // Apple's file carries its own padding, so it fills the button's inner height (48 minus the border).
    appleLogo: <Art id="logo-apple" height={46} style={{ height: 46, width: "auto" }} />,
    googleLogo: <Art id="logo-google" width={20} height={20} />,
  };
}
