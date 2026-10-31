// Picker search for colleges, schools and majors. Ignores case, accents, spaces and punctuation ("canada" finds Cañada,
// "mt san antonio" finds Mt. San Antonio), and matches a name's initials ("dvc" finds Diablo Valley College).

const fold = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const squash = (text: string) => fold(text).replace(/[^a-z0-9]/g, "");

// Left out of initials, the way people abbreviate: City College of San Francisco is "ccsf"
const SMALL_WORDS = new Set(["of", "the", "and", "at"]);
const initials = (text: string) =>
  fold(text)
    .split(/[^a-z0-9]+/)
    .filter((w) => w && !SMALL_WORDS.has(w))
    .map((w) => w[0])
    .join("");

// Initials count for the name only, not the city
export function matchesSearch(query: string, name: string, ...others: (string | null | undefined)[]) {
  const q = squash(query);
  if (!q) return true;
  if (q.length >= 2 && initials(name).startsWith(q)) return true;
  return [name, ...others].some((f) => f && squash(f).includes(q));
}
