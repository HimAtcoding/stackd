import { AuthScreen, AuthTop, providerLogos } from "@/components/auth/auth-screen";
import { SignUpForm } from "./sign-up-form";

export default function SignUpPage() {
  return (
    <AuthScreen clouds>
      <AuthTop headline="Let's get started!" subtitle="Save your plan and pick up where you left off." />
      <SignUpForm {...providerLogos()} />
    </AuthScreen>
  );
}
