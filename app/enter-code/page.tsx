import { Suspense } from "react";
import { Art } from "@/components/art";
import { AuthScreen } from "@/components/auth/auth-screen";
import { EnterCodeFlow } from "./enter-code-flow";

// 144 wide, right 16, cut edge 4 under the sheet, as on 08. Hidden below 372 wide.
const husky = (id: "husky-forgot" | "husky-wave") => (
  <div className="absolute right-4 -bottom-1 hidden w-36 min-[372px]:block">
    <Art id={id} width={144} height={152} preload reveal style={{ width: 144, height: "auto" }} />
  </div>
);

// /enter-code/?for=reset or ?for=confirm (09). The purpose comes from the query string, so it's read in the browser.
export default function EnterCodePage() {
  return (
    <AuthScreen clouds>
      <Suspense>
        <EnterCodeFlow huskies={{ reset: husky("husky-forgot"), confirm: husky("husky-wave") }} />
      </Suspense>
    </AuthScreen>
  );
}
