import type { Season, SeasonFilter } from "./types";

/** Current meteorological Season in Asia/Tokyo (not the visitor's local TZ). */
export function currentTokyoSeason(nowMs: number = Date.now()): Season {
  const month = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Tokyo",
      month: "numeric",
    }).format(new Date(nowMs)),
  );
  if (month === 12 || month <= 2) return "winter";
  if (month <= 5) return "spring";
  if (month <= 8) return "summer";
  return "autumn";
}

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

/** Atlas/collage `?season=` → Season filter; missing/invalid → Tokyo meteorological Season. */
export function parseSeasonSearchParam(
  value: string | string[] | undefined,
  nowMs: number = Date.now(),
): SeasonFilter {
  return readSeasonSearchParam(value) ?? currentTokyoSeason(nowMs);
}

type SeasonPath = "/" | "/atlas";

/** Pathname, or pathname + `?season=` when a filter is present. */
export function hrefWithSeason(
  pathname: SeasonPath,
  season: SeasonFilter | undefined,
): SeasonPath | { pathname: SeasonPath; query: { season: SeasonFilter } } {
  return season ? { pathname, query: { season } } : pathname;
}

/** Update `?season=` via history.replaceState — no App Router navigation / RSC flight. */
export function replaceSeasonSearchParam(next: SeasonFilter) {
  const url = new URL(window.location.href);
  url.searchParams.set("season", next);
  window.history.replaceState(
    window.history.state,
    "",
    `${url.pathname}${url.search}${url.hash}`,
  );
}
