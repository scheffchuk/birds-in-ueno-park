"use client";

import {
  startTransition,
  useEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import {
  parseSeasonSearchParam,
  readSeasonSearchParam,
  replaceSeasonSearchParam,
} from "@/lib/collage/season";
import type { SeasonFilter } from "@/lib/collage/types";

/**
 * Optimistic Season while a write is in flight.
 * Homepage collage filters client-side and only shallow-updates the URL, so
 * Next's useSearchParams never sees those writes — pending stays until a real
 * navigation refreshes the search string.
 */
let pendingSeason: SeasonFilter | undefined;
const pendingListeners = new Set<() => void>();

function subscribePending(listener: () => void) {
  pendingListeners.add(listener);
  return () => {
    pendingListeners.delete(listener);
  };
}

function getPendingSnapshot() {
  return pendingSeason;
}

function getPendingServerSnapshot() {
  return undefined as SeasonFilter | undefined;
}

function setPendingSeason(next: SeasonFilter | undefined) {
  pendingSeason = next;
  for (const listener of pendingListeners) listener();
}

function usePendingSeason() {
  return useSyncExternalStore(
    subscribePending,
    getPendingSnapshot,
    getPendingServerSnapshot,
  );
}

/** Resolved Season filter from `?season=` (defaults to Tokyo meteorological Season). */
export function useSeasonFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlSeason = parseSeasonSearchParam(
    searchParams.get("season") ?? undefined,
  );
  const pending = usePendingSeason();
  const season = pending ?? urlSeason;

  // Real Next navigations refresh useSearchParams — drop stale optimism.
  const urlKey = searchParams.toString();
  const prevUrlKeyRef = useRef(urlKey);
  useEffect(() => {
    if (prevUrlKeyRef.current === urlKey) return;
    prevUrlKeyRef.current = urlKey;
    setPendingSeason(undefined);
  }, [urlKey]);

  function setSeason(next: SeasonFilter) {
    if (next === season) return;
    setPendingSeason(next);

    // Collage filters client-side — shallow URL write only.
    // Atlas list is RSC-filtered — soft-navigate so the searchParams hole updates.
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

/** Present `?season=` only — undefined when missing/invalid (for carrying on nav links). */
export function useSeasonQuery(): SeasonFilter | undefined {
  const searchParams = useSearchParams();
  const pending = usePendingSeason();
  if (pending !== undefined) return pending;
  return readSeasonSearchParam(searchParams.get("season") ?? undefined);
}
