import { AuthScreen, AuthTop, providerLogos } from "@/components/auth/auth-screen";
import { SignInForm } from "./sign-in-form";

export default function SignInPage() {
  return (
    <AuthScreen clouds>
      <AuthTop headline="Welcome back!" subtitle="Your transfer journey is waiting." />
      <SignInForm {...providerLogos()} />
    </AuthScreen>
  );
}
