// Settings for the import pipeline. Local scripts only, never the app.

// Named in the User-Agent so a site's operators can reach us. The fetch stage refuses to run while it's "TODO".
export const CONTACT_EMAIL = "TODO";

export const USER_AGENT = `Stackd-Importer/0.1 (transfer planning for California community college students; +mailto:${CONTACT_EMAIL})`;

// One request at a time, at least this far apart
export const REQUEST_GAP_MS = 5000;

// The ASSIST agreement links a planning file may hold. Links only: nothing from the agreement itself is imported.
export const AGREEMENT_HOSTS = ["assist.org"];
