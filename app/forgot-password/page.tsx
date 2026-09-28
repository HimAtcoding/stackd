import { AuthScreen } from "@/components/auth/auth-screen";
import { ForgotPasswordFlow } from "./forgot-password-flow";

// No husky, wordmark or clouds: a short errand for a student who's already stuck (08).
export default function ForgotPasswordPage() {
  return (
    <AuthScreen>
      <ForgotPasswordFlow />
    </AuthScreen>
  );
}
