"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FEATURES, unbuiltFeature, type Unbuilt } from "@/lib/features";
import { PlaceholderScreen } from "./placeholder-screen";
import type { TabId } from "./ui/tab-bar";

// A screen that isn't built yet. With its flag on (development only) it's 00's placeholder; with it off, as in
// the v1 release, a stale link or a typed address replaces itself with Home, so nobody lands on "isn't built yet".
export function UnbuiltRoute({ screen, tab }: { screen: Unbuilt; tab?: TabId }) {
  const on = FEATURES[unbuiltFeature(screen)];
  if (on) return <PlaceholderScreen version="signed-in" tab={tab} />;
  return <GoHome />;
}

// Replaces this history entry with Home. Home sends a signed-out student to Welcome or Sign in.
export function GoHome() {
  const router = useRouter();
  useEffect(() => router.replace("/"), [router]);
  return null;
}
