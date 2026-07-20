import type { SeedCandidate } from "./types";

function seasonsWithSignal(c: SeedCandidate): number {
  return (Object.values(c.prevalence) as number[]).filter((v) => v > 0).length;
}

/**
 * Guide-species trim: drop escapes, one-off vagrants, and thin single-season
 * records; keep Naturalized only with multi-season Prevalence.
 * Target band ~60–70 regularly-occurring wild birds.
 */
export function trimGuideSpecies(candidates: SeedCandidate[]): SeedCandidate[] {
  return candidates.filter((c) => {
    if (c.exotic === "Exotic: Escapee") return false;
    if (c.exotic === "Exotic: Provisional") return false;

    const oneOff = c.weeksNonZero <= 2 && c.maxWeekFreq < 0.05;
    if (oneOff) return false;

    const maxPrev = Math.max(
      c.prevalence.winter,
      c.prevalence.spring,
      c.prevalence.summer,
      c.prevalence.autumn,
    );
    if (maxPrev < 10) return false;

    const seasons = seasonsWithSignal(c);
    // Single-season only if strong signal (regular migrant pulse)
    if (seasons === 1 && maxPrev < 25) return false;

    if (c.exotic === "Exotic: Naturalized") {
      return seasons >= 2;
    }

    return seasons >= 1;
  });
}
