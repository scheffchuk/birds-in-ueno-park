"use client";

import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import {
  parseSeasonSearchParam,
  readSeasonSearchParam,
} from "@/lib/collage/season";
import type { SeasonFilter } from "@/lib/collage/types";

/** Resolved Season filter from `?season=` (defaults to Tokyo meteorological Season). */
export function useSeasonFilter(): [
  SeasonFilter,
  (next: SeasonFilter) => void,
] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const season = parseSeasonSearchParam(
    searchParams.get("season") ?? undefined,
  );

  function setSeason(next: SeasonFilter) {
    router.replace({ pathname, query: { season: next } });
  }

  return [season, setSeason];
}

/** Present `?season=` only — undefined when missing/invalid (for carrying on nav links). */
export function useSeasonQuery(): SeasonFilter | undefined {
  const searchParams = useSearchParams();
  return readSeasonSearchParam(searchParams.get("season") ?? undefined);
}