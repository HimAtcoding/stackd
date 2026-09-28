import { Art } from "@/components/art";
import { PageTransition } from "@/components/page-transition";
import { SignInForm } from "./sign-in-form";
import styles from "./sign-in.module.css";

export default function SignInPage() {
  return (
    <PageTransition>
      <main className={`${styles.screen} relative mx-auto flex min-h-dvh max-w-[480px] flex-col`}>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[300px]">
          <Art id="home-clouds" fill optional className="object-cover" />
        </div>

        <div className="relative px-6 pb-5" style={{ paddingTop: "calc(var(--safe-top) + var(--strip-h) + 12px)" }}>
          <Art id="wordmark" width={100} height={28} label="Stackd" preload />
          <h1 className="relative z-[1] mt-6 max-w-[190px] text-navy-900 type-display">Welcome back!</h1>
          <p className="relative z-[1] mt-2 max-w-[160px] text-navy-900 type-body-md">Your transfer journey is waiting.</p>

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
            <Art id="burst-dashes" width={28} height={28} className="absolute left-3 top-2 -rotate-20" />
          </div>
        </div>

        <SignInForm
          appleLogo={<Art id="logo-apple" width={17} height={20} />}
          googleLogo={<Art id="logo-google" width={22} height={22} />}
        />
      </main>
    </PageTransition>
  );
}
