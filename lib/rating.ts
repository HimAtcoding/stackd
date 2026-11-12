import { isNativeApp } from "./capacitor";
import { FEATURES } from "./features";
import { readStorage, writeStorage } from "./storage";

// Apple's rating prompt (24 → 7): after the first successful Build my plan, and on the 3rd course marked done on a day
// after that build. iOS decides whether it shows and limits it to 3 a year. Never on the web, never a screen of our own.

export const RATING_KEY = "stackd.rating";

export type RatingState = {
  // The local day of the first build, "2026-11-11"
  builtOn: string | null;
  // Done marks made on days after builtOn
  laterDone: number;
  askedAfterDone: boolean;
};

const START: RatingState = { builtOn: null, laterDone: 0, askedAfterDone: false };

export const localDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// The rules, without storage or the plugin, so they can be tested. `ask` says whether to ask iOS now.
export function afterBuild(state: RatingState, today: Date): { state: RatingState; ask: boolean } {
  if (state.builtOn) return { state, ask: false };
  return { state: { ...state, builtOn: localDay(today) }, ask: true };
}

export function afterDoneMark(state: RatingState, today: Date): { state: RatingState; ask: boolean } {
  if (!state.builtOn || state.askedAfterDone || localDay(today) <= state.builtOn) return { state, ask: false };
  const laterDone = state.laterDone + 1;
  const ask = laterDone >= 3;
  return { state: { ...state, laterDone, askedAfterDone: ask }, ask };
}

function read(): RatingState {
  try {
    return { ...START, ...(JSON.parse(readStorage(RATING_KEY) ?? "null") as Partial<RatingState> | null) };
  } catch {
    return START;
  }
}

async function requestReview() {
  try {
    const { InAppReview } = await import("@capacitor-community/in-app-review");
    await InAppReview.requestReview();
  } catch {}
}

function step(rule: (state: RatingState, today: Date) => { state: RatingState; ask: boolean }) {
  if (!FEATURES.plan || !isNativeApp()) return;
  const { state, ask } = rule(read(), new Date());
  writeStorage(RATING_KEY, JSON.stringify(state));
  if (ask) requestReview();
}

export const noteBuilt = () => step(afterBuild);
export const noteDoneMark = () => step(afterDoneMark);
