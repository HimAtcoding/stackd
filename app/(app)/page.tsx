import { Art } from "@/components/art";
import { PageTransition } from "@/components/page-transition";
import { readSeed, type HomeSeed, type UniversitySeed } from "@/lib/seed";
import { HomeScreen } from "./_home/home-screen";

export default function HomePage() {
  const home = readSeed<HomeSeed>("home.json");
  const university = readSeed<UniversitySeed>("universities/uc-davis.json");

  return (
    <PageTransition>
      <HomeScreen
        home={home}
        university={university}
        wordmark={<Art id="wordmark" width={100} label="Stackd" preload />}
        husky={<Art id="husky-home" width={160} preload className="w-full" />}
        burst={<Art id="burst-dashes" width={28} height={28} />}
        clouds={<Art id="home-clouds" fill optional className="object-cover object-top" />}
      />
    </PageTransition>
  );
}
