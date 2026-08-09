import type { CollageSpecies } from "./types";

/**
 * Perched or in flight, decided by Slug so the collage stays stable across
 * renders. The aspect travels with the URL — sizing a tile from the pose that
 * isn't drawn letterboxes it inside `object-contain`.
 */
export function collagePose(bird: CollageSpecies): {
  url: string;
  aspect: number;
} {
  let h = 0;
  for (let i = 0; i < bird.slug.length; i += 1) {
    h = (h * 31 + bird.slug.charCodeAt(i)) | 0;
  }
  return (h & 1) === 1
    ? { url: bird.flightUrl, aspect: bird.aspectFlight }
    : { url: bird.perchUrl, aspect: bird.aspectPerch };
}
