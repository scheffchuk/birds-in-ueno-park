"use client";

import { startTransition } from "react";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import {
  readSeasonSearchParam,
  resolveSeasonFilter,
} from "@/lib/season/url";
import type { SeasonFilter } from "@/lib/season/types";

/** Effective Season filter — missing/invalid `?season=` → current Season in Tokyo. */
export function useSeasonFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const season = resolveSeasonFilter(
    searchParams.get("season") ?? undefined,
    Date.now(),
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
