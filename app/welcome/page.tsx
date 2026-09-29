import { Art } from "@/components/art";
import { PageTransition } from "@/components/page-transition";
import { RevealGroup } from "@/components/reveal-group";
import { UnofficialFooter } from "@/components/ui/unofficial-footer";
import { GetStarted, WelcomeRedirect } from "./welcome-client";
import styles from "./welcome.module.css";

const HUSKY_HEIGHT = "min(350px, 100cqh)";

export default function WelcomePage() {
  return (
    <PageTransition>
      <WelcomeRedirect />
      <main className="relative mx-auto flex h-dvh min-h-fit max-w-[480px] flex-col bg-sky-100">
        {/* The scene fills the whole screen, anchored to the top so short screens lose plaza, not sky */}
        <div className="fixed inset-0">
          <Art id="welcome-scene" fill preload className="object-cover object-top" />
        </div>
        <div aria-hidden className={`${styles.scrim} fixed inset-x-0 bottom-0`} />

        <div className="relative flex flex-1 flex-col" style={{ paddingBottom: "calc(var(--safe-bottom) + 12px)" }}>
          <div className={`${styles.top} flex flex-col items-center px-6 text-center`}>
            <div aria-hidden className={styles.skyScrim} />
            <Art id="wordmark" width={252} height={70} label="Stackd" preload className={styles.wordmark} />
            <h1 className={`${styles.headline} max-w-[320px] text-navy-900 type-display`}>
              Transfer plans, <br className="hidden min-[360px]:inline" />
              made simple.
            </h1>
            <p className={`${styles.body} max-w-[320px] text-navy-900 type-body-lg`}>
              Clear steps, real support, and everything you need to go further.
            </p>
          </div>

          <div className={`${styles.zone} relative mt-2 min-h-0 flex-1`}>
            <RevealGroup className="absolute inset-0">
              <div className={styles.husky}>
                <Art
                  id="husky-welcome"
                  width={276}
                  height={350}
                  preload
                  className={styles.huskyImg}
                  style={{ width: "auto", height: HUSKY_HEIGHT }}
                />
                <Art id="welcome-books" width={126} preload className={styles.books} />
              </div>
            </RevealGroup>
          </div>

          {/* Husky line to CTA top: 12 to the ground line, then 16 to the button */}
          <div aria-hidden className="h-7 shrink-0" />

          <div className="px-4">
            <GetStarted />
            <UnofficialFooter className="mt-2" />
          </div>
        </div>
      </main>
    </PageTransition>
  );
}
