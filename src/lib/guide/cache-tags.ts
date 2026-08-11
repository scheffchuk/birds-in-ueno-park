/** Global Guide species membership / list-shape tag. */
export const GUIDE_SPECIES_TAG = "guide-species";

/** Per-Slug Guide species detail cache tag. */
export function speciesCacheTag(slug: string): string {
  return `species:${slug}`;
}
