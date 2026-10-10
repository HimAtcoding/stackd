import { AuthScreen } from "@/components/auth/auth-screen";
import { OAuthCallback } from "./oauth-callback";

// /auth/callback/: where Apple and Google send the student back. A static page, so it works with no server.
export default function OAuthCallbackPage() {
  return (
    <AuthScreen>
      <OAuthCallback />
    </AuthScreen>
  );
}
