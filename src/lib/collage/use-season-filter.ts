"use client";

import { startTransition } from "react";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import {
  parseSeasonSearchParam,
  readSeasonSearchParam,
} from "@/lib/collage/season";
import type { SeasonFilter } from "@/lib/collage/types";

/** Active Season filter — defaults to All when `?season=` is missing. */
export function useSeasonFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const season = parseSeasonSearchParam(
    searchParams.get("season") ?? undefined,
  );

  function setSeason(next: SeasonFilter) {
    if (next === season) return;
    const query = Object.fromEntries(searchParams.entries());
    startTransition(() => {
      router.replace({ pathname, query: { ...query, season: next } });
    });
  }

  return { season, setSeason };
}

/** Present `?season=` only — undefined when missing/invalid (for nav links). */
export function useSeasonQuery(): SeasonFilter | undefined {
  const searchParams = useSearchParams();
  return readSeasonSearchParam(searchParams.get("season") ?? undefined);
}
