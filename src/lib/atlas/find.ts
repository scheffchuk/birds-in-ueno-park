import type { SpeciesRecord } from "@/lib/collage/types";

/** Public Atlas detail: Listed only; Unlisted → null (not-found). */
export function findListedBySlug(
  species: SpeciesRecord[],
  slug: string,
): SpeciesRecord | null {
  const match = species.find((s) => s.slug === slug);
  if (!match || !match.listed) return null;
  return match;
}
