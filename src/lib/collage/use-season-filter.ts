"use client";

import { startTransition, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import {
  getSeasonLocationEpoch,
  getSeasonLocationEpochServerSnapshot,
  parseSeasonSearchParam,
  readSeasonSearchParam,
  readWindowSeasonSearchParam,
  replaceSeasonSearchParam,
  subscribeSeasonLocation,
} from "@/lib/collage/season";
import type { SeasonFilter } from "@/lib/collage/types";

/**
 * `?season=` is the source of truth. Homepage shallow-updates the bar with
 * `replaceState` (invisible to `useSearchParams`) — after those writes, read
 * `window.location` instead. Until then, stay on the router search params so
 * SSR/hydration match.
 */
function useSeasonSearchParamValue(): string | null {
  const searchParams = useSearchParams();
  const fromRouter = searchParams.get("season");
  const epoch = useSyncExternalStore(
    subscribeSeasonLocation,
    getSeasonLocationEpoch,
    getSeasonLocationEpochServerSnapshot,
  );

  if (epoch > 0 && typeof window !== "undefined") {
    return readWindowSeasonSearchParam();
  }

  return fromRouter;
}

/** Active Season filter — defaults to All when `?season=` is missing. */
export function useSeasonFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const seasonParam = useSeasonSearchParamValue();
  const season = parseSeasonSearchParam(seasonParam ?? undefined);

  function setSeason(next: SeasonFilter) {
    if (next === season) return;

    if (pathname === "/") {
      replaceSeasonSearchParam(next);
      return;
    }

    const query = Object.fromEntries(searchParams.entries());
    startTransition(() => {
      router.replace({ pathname, query: { ...query, season: next } });
    });
  }

  return { season, setSeason };
}

/** Present `?season=` only — undefined when missing/invalid (for nav links). */
export function useSeasonQuery(): SeasonFilter | undefined {
  return readSeasonSearchParam(useSeasonSearchParamValue() ?? undefined);
}
