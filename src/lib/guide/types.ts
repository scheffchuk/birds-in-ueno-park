import type { Season } from "@/lib/season/types";
import type { IllustrationStatus } from "../../../convex/lib/selectForGeneration";

export type { IllustrationStatus };

export type SeasonalPrevalence = Record<Season, number>;

/** Full Guide species row as used by Atlas detail and fixtures. */
export type SpeciesRecord = {
  slug: string;
  sciName: string;
  comNameEn: string;
  comNameJa: string;
  comNameZhTw: string;
  listed: boolean;
  illustrationStatus: IllustrationStatus;
  prevalence: SeasonalPrevalence;
  descriptionEn?: string;
  descriptionJa?: string;
  descriptionZhTw?: string;
  spottingTipsEn?: string;
  spottingTipsJa?: string;
  spottingTipsZhTw?: string;
  perchUrl?: string;
  flightUrl?: string;
};
