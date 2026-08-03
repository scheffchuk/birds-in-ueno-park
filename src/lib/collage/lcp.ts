import { collagePoseUrl } from "./pose";
import { selectForCollage } from "./select";
import type { SeasonFilter, SpeciesRecord } from "./types";

export type CollageLcpCandidate = {
  slug: string;
  imageUrl: string;
};

/**
 * Cold-path LCP bird: highest Prevalence for the Season filter among
 * collage-eligible species; ties broken by Slug ascending.
 */
export function pickCollageLcpCandidate(
  species: SpeciesRecord[],
  filter: SeasonFilter,
): CollageLcpCandidate | null {
  const birds = selectForCollage(species, filter);
  let best: (typeof birds)[number] | null = null;
  for (const bird of birds) {
    if (!collagePoseUrl(bird)) continue;
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
