import type { SeasonalPrevalence } from "@/lib/guide/types";

export type ExoticFlag =
  | "Exotic: Escapee"
  | "Exotic: Naturalized"
  | "Exotic: Provisional"
  | null;

export type SeedCandidate = {
  sciName: string;
  comNameEn: string;
  comNameJa: string;
  comNameZhTw: string;
  prevalence: SeasonalPrevalence;
  exotic: ExoticFlag;
  /** Count of weeks with frequency > 0 after merge. */
  weeksNonZero: number;
  maxWeekFreq: number;
};

export type GuideSpeciesSeed = {
  sciName: string;
  comNameEn: string;
  comNameJa: string;
  comNameZhTw: string;
  slug: string;
  prevalence: SeasonalPrevalence;
};
