export type Season = "winter" | "spring" | "summer" | "autumn";

export type SeasonFilter = Season | "all";

export type IllustrationStatus =
  | "queued"
  | "generating"
  | "pendingReview"
  | "approved"
  | "failed";

export type SeasonalPrevalence = Record<Season, number>;

/** Row from `listForCollage` — approved art only, so both poses are present. */
export type CollageSpecies = {
  slug: string;
  sciName: string;
  comNameEn: string;
  comNameJa: string;
  comNameZhTw: string;
  prevalence: SeasonalPrevalence;
  perchUrl: string;
  flightUrl: string;
  aspectPerch: number;
  aspectFlight: number;
};

export type CollageBird = {
  slug: string;
  sciName: string;
  comNameEn: string;
  comNameJa: string;
  comNameZhTw: string;
  /** Prevalence for the selected Season filter (0–100). */
  prevalence: number;
  /** Chosen pose cutout and the aspect of that same pose. */
  url: string;
  aspect: number;
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
};

export type PackedBird = CollageBird & {
  x: number;
  y: number;
  width: number;
  height: number;
};
