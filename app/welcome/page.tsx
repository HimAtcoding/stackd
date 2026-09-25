import { Art } from "@/components/art";
import { PageTransition } from "@/components/page-transition";
import { UnofficialFooter } from "@/components/ui/unofficial-footer";
import { GetStarted, WelcomeRedirect } from "./welcome-client";
import styles from "./welcome.module.css";

export default function WelcomePage() {
  return (
    <PageTransition>
      <WelcomeRedirect />
      <main className={`${styles.screen} relative mx-auto flex h-dvh min-h-fit max-w-[480px] flex-col overflow-hidden`}>
        <div className={`${styles.scene} absolute inset-x-0 bottom-0`}>
          <Art id="welcome-scene" fill preload className="object-cover object-bottom" />
        </div>

        <div
          className="relative flex flex-1 flex-col items-center px-6 text-center"
          style={{ paddingTop: "calc(var(--safe-top) + var(--strip-h) + 24px)" }}
        >
          <Art id="wordmark" width={252} height={70} label="Stackd" preload />
          <h1 className="mt-10 max-w-[320px] text-navy-900 type-display">
            Transfer plans, <br className="hidden min-[360px]:inline" />
            made simple.
          </h1>
          <p className="mt-3 max-w-[320px] text-navy-900 type-body-lg">
            Clear steps, real support, and everything you need to go further.
          </p>
          <div className={`${styles.zone} mt-4 flex min-h-0 w-full flex-1 items-end justify-center`}>
            <Art id="husky-welcome" width={300} height={380} preload reveal
              className={styles.husky}
              style={{ width: "auto", height: "min(380px, 100cqh)" }}
            />
          </div>
        </div>

        <div aria-hidden className={`${styles.scrim} absolute inset-x-0 bottom-0`} />

        <div className="absolute inset-x-4" style={{ bottom: "calc(var(--safe-bottom) + 12px)" }}>
          <GetStarted />
          <UnofficialFooter className="mt-2" />
        </div>
      </main>
    </PageTransition>
  );
}
