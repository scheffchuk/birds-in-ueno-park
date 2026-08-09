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
 * A Season picked this session, tagged with the search string it was picked
 * against. The homepage collage filters client-side and only shallow-updates
 * the URL, so `useSearchParams` never sees those writes and the pick stands.
 * A real navigation changes the search string, which retires the pick.
 */
type SeasonPick = { season: SeasonFilter; urlKey: string };

type SeasonPickStore = {
  pick: SeasonPick | undefined;
  setPick: (next: SeasonPick) => void;
};

const SeasonPickContext = createContext<SeasonPickStore | null>(null);

export function SeasonProvider({ children }: { children: ReactNode }) {
  const [pick, setPick] = useState<SeasonPick>();
  return (
    <SeasonPickContext value={{ pick, setPick }}>{children}</SeasonPickContext>
  );
}

function useSeasonPick(): SeasonPickStore {
  const store = useContext(SeasonPickContext);
  if (!store) throw new Error("Season hooks require <SeasonProvider>");
  return store;
}

/** Resolved Season filter from `?season=` (defaults to Tokyo meteorological Season). */
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
  const { pick } = useSeasonPick();

  if (pick?.urlKey === searchParams.toString()) return pick.season;
  return readSeasonSearchParam(searchParams.get("season") ?? undefined);
}
