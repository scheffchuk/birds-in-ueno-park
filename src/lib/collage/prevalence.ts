import type { SeasonFilter, SpeciesRecord } from "./types";

export function prevalenceForFilter(
  record: SpeciesRecord,
  filter: SeasonFilter,
): number {
  if (filter === "all") {
    return Math.max(
      record.prevalence.winter,
      record.prevalence.spring,
      record.prevalence.summer,
      record.prevalence.autumn,
    );
  }
  return record.prevalence[filter];
}
