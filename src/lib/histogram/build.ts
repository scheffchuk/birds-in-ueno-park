import { readFileSync } from "node:fs";
import { weeksToSeasonalPrevalence } from "./aggregate";
import { mergeHistogramsMax } from "./merge";
import { parseHistogramTsv } from "./parse";
import { slugFromSciName } from "./slug";
import { trimGuideSpecies } from "./trim";
import type { ExoticFlag, GuideSpeciesSeed, SeedCandidate } from "./types";

export type NameDictionaries = {
  ja: Record<string, string>;
  zhTw: Record<string, string>;
};

export type BuildGuideArgs = {
  tsvTexts: string[];
  exoticBySciName: Record<string, string>;
  names: NameDictionaries;
};

function asExotic(flag: string | undefined): ExoticFlag {
  if (
    flag === "Exotic: Escapee" ||
    flag === "Exotic: Naturalized" ||
    flag === "Exotic: Provisional"
  ) {
    return flag;
  }
  return null;
}

/** Parse → merge max → season Prevalence → Guide-species trim. */
export function buildGuideSpecies(args: BuildGuideArgs): GuideSpeciesSeed[] {
  const parsed = args.tsvTexts.map(parseHistogramTsv);
  const merged = mergeHistogramsMax(...parsed);

  const candidates: SeedCandidate[] = merged.map((row) => {
    const prevalence = weeksToSeasonalPrevalence(row.weeks);
    const weeksNonZero = row.weeks.filter((w) => w > 0).length;
    const maxWeekFreq = row.weeks.reduce((m, w) => Math.max(m, w), 0);
    return {
      sciName: row.sciName,
      comNameEn: row.comNameEn,
      comNameJa: args.names.ja[row.sciName] ?? row.comNameEn,
      comNameZhTw: args.names.zhTw[row.sciName] ?? row.comNameEn,
      prevalence,
      exotic: asExotic(args.exoticBySciName[row.sciName]),
      weeksNonZero,
      maxWeekFreq,
    };
  });

  return trimGuideSpecies(candidates)
    .map((c) => ({
      sciName: c.sciName,
      comNameEn: c.comNameEn,
      comNameJa: c.comNameJa,
      comNameZhTw: c.comNameZhTw,
      slug: slugFromSciName(c.sciName),
      prevalence: c.prevalence,
    }))
    .sort((a, b) => a.sciName.localeCompare(b.sciName));
}

export function loadJsonRecord(path: string): Record<string, string> {
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, string>;
}
