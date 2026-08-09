import type { PackedBird } from "./types";

export const COLLAGE_IMAGE_SIZES = "120px";

/** Collage LCP candidate. */
export function largestTileSlug(placed: PackedBird[]): string | null {
  let best: PackedBird | null = null;
  let bestArea = 0;
  for (const tile of placed) {
    const area = tile.width * tile.height;
    if (area > bestArea) {
      bestArea = area;
      best = tile;
    }
  }
  return best?.slug ?? null;
}
