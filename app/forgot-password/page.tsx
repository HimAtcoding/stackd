import { Art } from "@/components/art";
import { AuthScreen } from "@/components/auth/auth-screen";
import { ForgotPasswordFlow } from "./forgot-password-flow";

// Rev 2: the husky is back, top right, with its cut edge under the sheet as on Sign in. Hidden below 372 wide, where the headline would run under it.
export default function ForgotPasswordPage() {
  return (
    <AuthScreen clouds>
      <ForgotPasswordFlow
        husky={
          <div className="absolute right-4 -bottom-1 hidden w-36 min-[372px]:block">
            <Art id="husky-forgot" width={144} height={152} preload reveal style={{ width: 144, height: "auto" }} />
          </div>
        }
      />
    </AuthScreen>
  );
}
