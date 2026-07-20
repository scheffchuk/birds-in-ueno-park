export type IllustrationStatus =
  | "queued"
  | "generating"
  | "pendingReview"
  | "approved"
  | "failed";

export type GenerationCandidate = {
  slug: string;
  listed: boolean;
  illustrationStatus: IllustrationStatus;
  hasAnatomyRef: boolean;
};

const NEEDS_ART = new Set<IllustrationStatus>(["queued", "failed"]);

/**
 * Listed species missing approved art, with anatomy refs ready.
 * Default limit 20 for the validation slice.
 */
export function selectSpeciesForGeneration(
  candidates: GenerationCandidate[],
  opts: { limit?: number; slugs?: string[] } = {},
): GenerationCandidate[] {
  const slugFilter = opts.slugs ? new Set(opts.slugs) : null;
  const limit = opts.limit ?? 20;

  const selected = candidates.filter((c) => {
    if (!c.listed) return false;
    if (!c.hasAnatomyRef) return false;
    if (slugFilter && !slugFilter.has(c.slug)) return false;
    if (slugFilter) {
      // Explicit slug: allow queued/failed/generating (re-submit) but not approved
      return c.illustrationStatus !== "approved";
    }
    return NEEDS_ART.has(c.illustrationStatus);
  });

  return selected.slice(0, limit);
}
