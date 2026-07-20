export type Season = "winter" | "spring" | "summer" | "autumn";

export type SeasonFilter = Season | "all";

export type IllustrationStatus =
  | "queued"
  | "generating"
  | "pendingReview"
  | "approved"
  | "failed";

export type SeasonalPrevalence = Record<Season, number>;

export type CollageBird = {
  slug: string;
  sciName: string;
  comNameEn: string;
  comNameJa: string;
  comNameZhTw: string;
  /** Prevalence for the selected Season filter (0–100). */
  prevalence: number;
  perchUrl?: string;
  flightUrl?: string;
  dimsPerch?: number[];
  dimsFlight?: number[];
  maskPerch?: { w: number; h: number; bits: string };
  maskFlight?: { w: number; h: number; bits: string };
};

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
  dimsPerch?: number[];
  dimsFlight?: number[];
  maskPerch?: { w: number; h: number; bits: string };
  maskFlight?: { w: number; h: number; bits: string };
};

export type PackedBird = CollageBird & {
  x: number;
  y: number;
  width: number;
  height: number;
};
