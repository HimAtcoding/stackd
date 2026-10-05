import { Art } from "@/components/art";
import { PageTransition } from "@/components/page-transition";
import { HomeScreen } from "./_home/home-screen";

// Data loads in the browser (lib/data), so this page is static.
export default function HomePage() {
  return (
    <PageTransition>
      <HomeScreen
        wordmark={<Art id="wordmark" width={100} label="Stackd" preload />}
        husky={<Art id="husky-home" width={160} preload className="w-full" />}
        burst={<Art id="burst-dashes" width={28} height={28} />}
        clouds={<Art id="home-clouds" fill optional className="object-cover object-top" />}
      />
    </PageTransition>
  );
}
