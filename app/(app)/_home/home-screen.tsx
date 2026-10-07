"use client";

import { DEMO_MODE } from "@/lib/flags";
import { AccountHome } from "./account-home";
import { DemoHome } from "./demo-home";
import type { HomeArt } from "./home-frame";

// Real accounts read their saved plan; demo mode reads data/seed (02 → Plan states)
export function HomeScreen(art: HomeArt) {
  return DEMO_MODE ? <DemoHome art={art} /> : <AccountHome art={art} />;
}
