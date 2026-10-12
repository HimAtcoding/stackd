import { PageTransition } from "@/components/page-transition";
import { OAuthCallback } from "./oauth-callback";

// /auth/callback/: where Apple and Google send the student back on the web. A static page, so it works with no
// server. Only the loading component, centered on --sky-50 (06 → Web sign-in return).
export default function OAuthCallbackPage() {
  return (
    <PageTransition>
      <main className="flex min-h-dvh items-center justify-center bg-sky-50">
        <OAuthCallback />
      </main>
    </PageTransition>
  );
}
