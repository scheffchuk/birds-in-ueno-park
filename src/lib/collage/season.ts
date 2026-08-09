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

type SeasonLocationListener = () => void;

let seasonLocationEpoch = 0;
let popstateSubscriberCount = 0;
const seasonLocationListeners = new Set<SeasonLocationListener>();

function notifySeasonLocationListeners() {
  seasonLocationEpoch += 1;
  for (const listener of seasonLocationListeners) listener();
}

/** Subscribe to homepage shallow `?season=` writes and browser history hops. */
export function subscribeSeasonLocation(listener: SeasonLocationListener) {
  seasonLocationListeners.add(listener);
  if (typeof window !== "undefined") {
    if (popstateSubscriberCount === 0) {
      window.addEventListener("popstate", notifySeasonLocationListeners);
    }
    popstateSubscriberCount += 1;
  }
  return () => {
    seasonLocationListeners.delete(listener);
    if (typeof window !== "undefined") {
      popstateSubscriberCount -= 1;
      if (popstateSubscriberCount === 0) {
        window.removeEventListener("popstate", notifySeasonLocationListeners);
      }
    }
  };
}

export function getSeasonLocationEpoch() {
  return seasonLocationEpoch;
}

export function getSeasonLocationEpochServerSnapshot() {
  return 0;
}

/** Live `?season=` from the address bar (client). */
export function readWindowSeasonSearchParam(): string | null {
  return new URLSearchParams(window.location.search).get("season");
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
  notifySeasonLocationListeners();
}
