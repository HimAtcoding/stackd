// Demo strip and demo auth stay on unless NEXT_PUBLIC_DEMO_STRIP is "off", "false" or "0".
const raw = process.env.NEXT_PUBLIC_DEMO_STRIP?.toLowerCase();

export const DEMO_STRIP = !(raw === "off" || raw === "false" || raw === "0");
