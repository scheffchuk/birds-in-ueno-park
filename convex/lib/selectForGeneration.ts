import type { Doc } from "../_generated/dataModel";

export type IllustrationStatus = Doc<"species">["illustrationStatus"];

export type GenerationCandidate = {
  slug: string;
  listed: boolean;
  illustrationStatus: IllustrationStatus;
  hasAnatomyRef: boolean;
  /** Flight-pose anatomy photo required for generate. */
  hasFlightAnatomyRef: boolean;
  /** True when both perch + flight cutouts are stored. */
  hasCutoutPair?: boolean;
};

/** Eligible for a new illustration generate submit. */
const NEEDS_ART = new Set<IllustrationStatus>([
  "queued",
  "failed",
  "generating",
]);

function hasBothAnatomyRefs(c: GenerationCandidate): boolean {
  return c.hasAnatomyRef && c.hasFlightAnatomyRef;
}

/**
 * Listed species missing approved art, with both perch + flight anatomy refs.
 * Default limit 20 for the validation slice.
 *
 * "approved" without a cutout pair is treated as needing generation
 * (status was stamped wrongly / placeholders).
 */
export function selectSpeciesForGeneration(
  candidates: GenerationCandidate[],
  opts: { limit?: number; slugs?: string[] } = {},
): GenerationCandidate[] {
  const slugFilter = opts.slugs ? new Set(opts.slugs) : null;
  const limit = opts.limit ?? 20;

  const selected = candidates.filter((c) => {
    if (!c.listed) return false;
    if (!hasBothAnatomyRefs(c)) return false;
    if (slugFilter && !slugFilter.has(c.slug)) return false;

    const trulyApproved =
      c.illustrationStatus === "approved" && c.hasCutoutPair === true;
    if (trulyApproved) return false;

    if (slugFilter) return true;

    if (NEEDS_ART.has(c.illustrationStatus)) return true;
    // Bogus approved / pending without files
    if (
      (c.illustrationStatus === "approved" ||
        c.illustrationStatus === "pendingReview") &&
      c.hasCutoutPair !== true
    ) {
      return true;
    }
    return false;
  });

  return selected.slice(0, limit);
}

/** Explain an empty selection for admin UI. */
export function explainEmptyGenerationSelection(
  candidates: GenerationCandidate[],
): string {
  const listed = candidates.filter((c) => c.listed);
  const withAnatomy = listed.filter((c) => hasBothAnatomyRefs(c));
  const withCutouts = withAnatomy.filter((c) => c.hasCutoutPair === true);
  const queuedOrFailed = withAnatomy.filter(
    (c) =>
      c.illustrationStatus === "queued" || c.illustrationStatus === "failed",
  );
  const generating = withAnatomy.filter(
    (c) => c.illustrationStatus === "generating",
  );
  const pending = withAnatomy.filter(
    (c) => c.illustrationStatus === "pendingReview",
  );
  const approved = withAnatomy.filter(
    (c) => c.illustrationStatus === "approved",
  );
  const approvedNoArt = approved.filter((c) => c.hasCutoutPair !== true);
  const missingPerchAnatomy = listed.filter((c) => !c.hasAnatomyRef).length;
  const missingFlightAnatomy = listed.filter(
    (c) => c.hasAnatomyRef && !c.hasFlightAnatomyRef,
  ).length;

  return [
    `No species selected.`,
    `Listed ${listed.length}; with perch+flight anatomy ${withAnatomy.length}; missing perch anatomy ${missingPerchAnatomy}; missing flight anatomy ${missingFlightAnatomy};`,
    `cutout pairs ${withCutouts.length}; queued/failed ${queuedOrFailed.length}; generating ${generating.length};`,
    `pendingReview ${pending.length}; approved ${approved.length} (${approvedNoArt.length} without cutouts).`,
    approvedNoArt.length > 0
      ? `Approved-without-cutouts should be selectable — refresh and retry Generate.`
      : "",
    missingPerchAnatomy > 0 && withAnatomy.length === 0
      ? `Seed perch anatomy first.`
      : "",
    missingFlightAnatomy > 0 && withAnatomy.length === 0
      ? `Upload or seed flight anatomy first.`
      : "",
  ]
    .filter(Boolean)
    .join(" ");
}
