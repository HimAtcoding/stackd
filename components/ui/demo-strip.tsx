// Required wherever demo records show (06-trust-and-provenance). Screens render it when their data
// carries "demo": true, so it follows the data, not the sign-in mode.
export function DemoStrip() {
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
