// Settings for the import pipeline. Local scripts only, never the app.

// Named in the User-Agent so a site's operators can reach us. The fetch stage refuses to run while it's "TODO".
export const CONTACT_EMAIL = "joinstackd@gmail.com";

export const USER_AGENT = `Stackd-Importer/0.1 (transfer planning for California community college students; +mailto:${CONTACT_EMAIL})`;

// One request at a time, at least this far apart
export const REQUEST_GAP_MS = 5000;

// The ASSIST agreement links a planning file may hold. Links only: nothing from the agreement itself is imported.
export const AGREEMENT_HOSTS = ["assist.org"];

// Where an Explore file's sources live (21): UC Admissions for a UC Transfer Pathway, the Chancellor's Office for a TMC
export const EXPLORE_HOSTS = { uc_pathway: ["admission.universityofcalifornia.edu"], tmc: ["cccco.edu"] };

// An opportunity links to its official page, never a social post (22 → Why)
export const SOCIAL_HOSTS = [
  "instagram.com", "facebook.com", "fb.com", "tiktok.com", "twitter.com", "x.com", "threads.net", "reddit.com", "linkedin.com", "youtube.com", "youtu.be",
];
