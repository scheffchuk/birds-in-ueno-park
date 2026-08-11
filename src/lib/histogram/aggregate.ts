import type { SeasonalPrevalence } from "@/lib/collage/types";
import type { Season } from "@/lib/season/types";

/** Month-week indices (0–47): Jan weeks 0–3 … Dec weeks 44–47. */
const SEASON_WEEKS: Record<Season, readonly number[]> = {
  winter: [44, 45, 46, 47, 0, 1, 2, 3, 4, 5, 6, 7], // Dec–Feb
  spring: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19], // Mar–May
  summer: [20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31], // Jun–Aug
  autumn: [32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43], // Sep–Nov
};

/** Max weekly frequency in a Season, as Prevalence 0–100. */
export function weeksToSeasonalPrevalence(weeks: number[]): SeasonalPrevalence {
  if (weeks.length !== 48) {
    throw new Error(`Expected 48 weeks, got ${weeks.length}`);
  }
  const out = {} as SeasonalPrevalence;
  for (const season of Object.keys(SEASON_WEEKS) as Season[]) {
    let max = 0;
    for (const i of SEASON_WEEKS[season]) {
      max = Math.max(max, weeks[i] ?? 0);
    }
    out[season] = Math.round(max * 100);
  }
  return out;
}
