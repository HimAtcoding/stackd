import { Art, artSize } from "@/components/art";
import { PageTransition } from "@/components/page-transition";
import { RevealGroup } from "@/components/reveal-group";
import { UnofficialFooter } from "@/components/ui/unofficial-footer";
import { GetStarted, WelcomeRedirect } from "./welcome-client";
import { WelcomeFrame } from "./welcome-frame";
import styles from "./welcome.module.css";

// From the layout hook: the smallest of 350, 40% of the viewport, the zone, and the banner check
const HUSKY_HEIGHT = "var(--husky-h, min(350px, 40dvh, 100cqh))";

export default function WelcomePage() {
  // Proportions from the files, or the sizes in art-assets while a file is missing
  const scene = artSize("welcome-scene") ?? { w: 1179, h: 2556 };
  const husky = artSize("husky-welcome") ?? { w: 900, h: 1140 };
  const books = artSize("welcome-books") ?? { w: 480, h: 410 };
  const ratios = { scene: scene.h / scene.w, husky: husky.w / husky.h, books: books.h / books.w };

  return (
    <PageTransition>
      <WelcomeRedirect />
      <WelcomeFrame
        ratios={ratios}
        scene={<Art id="welcome-scene" fill preload className="object-cover" />}
        text={
          <>
            <Art id="wordmark" width={252} height={70} label="Stackd" preload className={styles.wordmark} />
            <h1 className={`${styles.headline} max-w-[320px] text-navy-900 type-display`}>
              Transfer plans, <br className="hidden min-[360px]:inline" />
              made simple.
            </h1>
            <p className={`${styles.body} max-w-[320px] text-navy-900 type-body-lg`}>
              Clear steps, real support, and everything you need to go further.
            </p>
          </>
        }
        art={
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
        }
        cta={
          <>
            <GetStarted />
            <UnofficialFooter className="mt-2" />
          </>
        }
      />
    </PageTransition>
  );
}
