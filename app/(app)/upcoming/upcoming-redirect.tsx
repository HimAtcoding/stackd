"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { deadlinesHref } from "@/lib/features";

// Old Upcoming links (02) now lead to the Deadlines screen, or Home while it's off
export function UpcomingRedirect() {
  const router = useRouter();
  useEffect(() => router.replace(deadlinesHref() ?? "/"), [router]);
  return null;
}
