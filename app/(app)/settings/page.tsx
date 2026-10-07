import { PageTransition } from "@/components/page-transition";
import { SettingsScreen } from "./_settings/settings-screen";

// /settings/ (11): pushed from Home's gear. No tab bar and no demo strip.
export default function SettingsPage() {
  return (
    <PageTransition>
      <SettingsScreen />
    </PageTransition>
  );
}
