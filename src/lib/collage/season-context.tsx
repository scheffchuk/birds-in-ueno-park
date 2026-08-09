"use client";

import {
  createContext,
  startTransition,
  useContext,
  useState,
  type ReactNode,
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
 * Homepage shallow-updates `?season=` (no RSC), so `useSearchParams` stays
 * stale — keep the chosen Season here until a real navigation changes the URL.
 */
type SeasonPick = { season: SeasonFilter; urlKey: string };

const SeasonPickContext = createContext<{
  pick: SeasonPick | undefined;
  setPick: (next: SeasonPick) => void;
} | null>(null);

export function SeasonProvider({ children }: { children: ReactNode }) {
  const [pick, setPick] = useState<SeasonPick>();
  return (
    <SeasonPickContext value={{ pick, setPick }}>{children}</SeasonPickContext>
  );
}

function useSeasonPick() {
  const store = useContext(SeasonPickContext);
  if (!store) throw new Error("Season hooks require <SeasonProvider>");
  return store;
}

/** Active Season filter — defaults to All when `?season=` is missing. */
export function useSeasonFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { pick, setPick } = useSeasonPick();

  const urlKey = searchParams.toString();
  const season =
    pick?.urlKey === urlKey
      ? pick.season
      : parseSeasonSearchParam(searchParams.get("season") ?? undefined);

  function setSeason(next: SeasonFilter) {
    if (next === season) return;
    setPick({ season: next, urlKey });

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
  const searchParams = useSearchParams();
  const { pick } = useSeasonPick();

  if (pick?.urlKey === searchParams.toString()) return pick.season;
  return readSeasonSearchParam(searchParams.get("season") ?? undefined);
}
