export type CopyCandidate = {
  slug: string;
  sciName: string;
  comNameEn: string;
};

/** Pick Guide species for copy generation (spot-check via limit or slug). */
export function selectSpeciesForCopy<T extends CopyCandidate>(
  species: T[],
  opts: { limit?: number; slug?: string } = {},
): T[] {
  let selected = species;
  if (opts.slug) {
    selected = selected.filter((s) => s.slug === opts.slug);
  }
  if (opts.limit !== undefined) {
    selected = selected.slice(0, opts.limit);
  }
  return selected;
}
