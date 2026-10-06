// Real mode by default: Supabase email sign-in. Demo mode (demo auth, no accounts) only when
// NEXT_PUBLIC_DEMO_STRIP is "on", "true" or "1", for local demos.
// The demo strip itself follows the data: it shows wherever a screen shows demo records.
const raw = process.env.NEXT_PUBLIC_DEMO_STRIP?.toLowerCase();

export const DEMO_MODE = raw === "on" || raw === "true" || raw === "1";
