import { collagePoseUrl } from "./pose";
import type { PackedBird } from "./types";

/** Shared by collage preloads and tiles so srcset picks match. */
export const COLLAGE_IMAGE_SIZES = "120px";

export function largestIllustratedTileSlug(
  placed: PackedBird[],
): string | null {
  let best: PackedBird | null = null;
  let bestArea = 0;
  for (const tile of placed) {
    if (!collagePoseUrl(tile)) continue;
    const area = tile.width * tile.height;
    if (area > bestArea) {
      bestArea = area;
      best = tile;
    }
  }
  return best?.slug ?? null;
}
