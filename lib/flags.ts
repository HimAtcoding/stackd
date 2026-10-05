// Demo mode stays on unless NEXT_PUBLIC_DEMO_STRIP is "off", "false" or "0".
// On: demo auth (no accounts) for local demos. Off: Supabase email sign-in.
// The demo strip itself follows the data: it shows wherever a screen shows demo records.
const raw = process.env.NEXT_PUBLIC_DEMO_STRIP?.toLowerCase();

export const DEMO_MODE = !(raw === "off" || raw === "false" || raw === "0");
