import { artSize } from "@/components/art";
import type { ArtId } from "./art";

// The shared pool of generic campus images (art-assets → Campus art). A new image only needs adding here and in lib/art.ts.
export const CAMPUS_POOL = ["campus-1", "campus-2", "campus-3", "campus-4"] as const satisfies readonly ArtId[];

type CampusId = (typeof CAMPUS_POOL)[number];

const isCampusId = (id: string | undefined): id is CampusId => CAMPUS_POOL.includes(id as CampusId);

// Same slug, same image, every time (djb2).
function hash(slug: string) {
  let h = 5381;
  for (const c of slug) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0;
  return h;
}

// Server only. The record's heroImage if it's in the pool, otherwise a pick by slug.
// A missing file falls through to the next image; with none at all, the picked id renders the labelled placeholder.
export function campusImage(slug: string, heroImage?: string): CampusId {
  const start = isCampusId(heroImage) ? CAMPUS_POOL.indexOf(heroImage) : hash(slug) % CAMPUS_POOL.length;
  for (let i = 0; i < CAMPUS_POOL.length; i++) {
    const id = CAMPUS_POOL[(start + i) % CAMPUS_POOL.length];
    if (artSize(id)) return id;
  }
  return CAMPUS_POOL[start];
}
