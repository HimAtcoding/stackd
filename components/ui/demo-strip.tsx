import { DEMO_STRIP } from "@/lib/flags";

// Required until real data replaces demo data (06-trust-and-provenance).
// Only on screens that show demo records: Home, University, Essays and the celebration.
export function DemoStrip() {
  if (!DEMO_STRIP) return null;
  return (
    <div
      data-demo-strip
      className="fixed inset-x-0 z-50 flex h-6 items-center justify-center bg-navy-900 text-white type-demo"
      style={{ top: "var(--safe-top)" }}
    >
      Demo data
    </div>
  );
}
