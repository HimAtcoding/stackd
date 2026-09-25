// Required until real data replaces demo data (06-trust-and-provenance).
export function DemoStrip() {
  return (
    <div
      className="fixed inset-x-0 z-50 flex h-6 items-center justify-center bg-navy-900 text-white type-demo"
      style={{ top: "var(--safe-top)" }}
    >
      Demo data
    </div>
  );
}
