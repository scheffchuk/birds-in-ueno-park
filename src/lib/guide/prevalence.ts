import type { SeasonFilter } from "@/lib/season/types";
import type { SeasonalPrevalence } from "./types";

/** Prevalence for a Season filter — All-year is seasonal-max. */
export function prevalenceForFilter(
  record: { prevalence: SeasonalPrevalence },
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
