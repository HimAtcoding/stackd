import { Suspense } from "react";
import { PageTransition } from "@/components/page-transition";
import { EditorRoute } from "../_essays/editor";

// /essays/edit/?q={key} (17 → Editor): one answer, full screen, no tab bar
export default function EssayEditorPage() {
  return (
    <PageTransition>
      <Suspense fallback={<div className="min-h-dvh bg-surface" />}>
        <EditorRoute />
      </Suspense>
    </PageTransition>
  );
}
