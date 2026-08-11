import { seasonAt } from "./calendar";
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

/**
 * Effective Season filter for collage/atlas.
 * Explicit values win; missing/invalid → current Season for `instant` (pass Tokyo wall clock from the client).
 */
export function resolveSeasonFilter(
  value: string | string[] | undefined,
  instant: Date | number,
): SeasonFilter {
  return readSeasonSearchParam(value) ?? seasonAt(instant);
}

/** Paths that may carry a Season filter query. */
export type SeasonHrefPath = "/" | "/atlas" | `/atlas/${string}`;

/** Pathname, or pathname + `?season=` when a filter is present (including all). */
export function hrefWithSeason(
  pathname: SeasonHrefPath,
  season: SeasonFilter | undefined,
): SeasonHrefPath | { pathname: SeasonHrefPath; query: { season: SeasonFilter } } {
  return season ? { pathname, query: { season } } : pathname;
}
