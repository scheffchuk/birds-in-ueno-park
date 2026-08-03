import { collagePoseUrl } from "./pose";
import { selectForCollage } from "./select";
import type { CollageBird, SeasonFilter, SpeciesRecord } from "./types";

export type CollageLcpCandidate = {
  slug: string;
  imageUrl: string;
};

/** Shared with the preload link and the LCP tile so srcset picks match. */
export const COLLAGE_LCP_SIZES = "40vw";

export function pickCollageLcpCandidate(
  species: SpeciesRecord[],
  filter: SeasonFilter,
): CollageLcpCandidate | null {
  const birds = selectForCollage(species, filter);
  let best: CollageBird | null = null;
  for (const bird of birds) {
    if (
      !best ||
      bird.prevalence > best.prevalence ||
      (bird.prevalence === best.prevalence && bird.slug < best.slug)
    ) {
      best = bird;
    }
  }
  if (!best) return null;
  const imageUrl = collagePoseUrl(best);
  if (!imageUrl) return null;
  return { slug: best.slug, imageUrl };
}
