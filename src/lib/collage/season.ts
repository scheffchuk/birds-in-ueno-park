import type { SeasonFilter } from "./types";

export const SEASON_FILTERS = [
  "winter",
  "spring",
  "summer",
  "autumn",
  "all",
] as const satisfies readonly SeasonFilter[];

const SEASON_FILTER_SET: ReadonlySet<string> = new Set(SEASON_FILTERS);

export function isSeasonFilter(value: string): value is SeasonFilter {
  return SEASON_FILTER_SET.has(value);
}

/** `?season=` when valid; otherwise undefined (do not invent a default). */
export function readSeasonSearchParam(
  value: string | string[] | undefined,
): SeasonFilter | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw === "string" && isSeasonFilter(raw)) return raw;
  return undefined;
}

/** Atlas/collage `?season=` → Season filter; missing/invalid → All. */
export function parseSeasonSearchParam(
  value: string | string[] | undefined,
): SeasonFilter {
  return readSeasonSearchParam(value) ?? "all";
}

/** Paths that may carry a Season filter query. */
export type SeasonHrefPath = "/" | "/atlas" | `/atlas/${string}`;

/** Pathname, or pathname + `?season=` when a filter is present. */
export function hrefWithSeason(
  pathname: SeasonHrefPath,
  season: SeasonFilter | undefined,
): SeasonHrefPath | { pathname: SeasonHrefPath; query: { season: SeasonFilter } } {
  return season ? { pathname, query: { season } } : pathname;
}
