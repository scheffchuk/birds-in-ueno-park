export type Season = "winter" | "spring" | "summer" | "autumn";

export type SeasonFilter = Season | "all";

export type IllustrationStatus =
  | "queued"
  | "generating"
  | "pendingReview"
  | "approved"
  | "failed";

export type SeasonalPrevalence = Record<Season, number>;

export type SpeciesRecord = {
  slug: string;
  sciName: string;
  comNameEn: string;
  comNameJa: string;
  comNameZhTw: string;
  listed: boolean;
  illustrationStatus: IllustrationStatus;
  prevalence: SeasonalPrevalence;
};

export type CollageBird = {
  slug: string;
  sciName: string;
  comNameEn: string;
  comNameJa: string;
  comNameZhTw: string;
  /** Prevalence for the selected Season filter (0–100). */
  prevalence: number;
};

export type PackedBird = CollageBird & {
  x: number;
  y: number;
  width: number;
  height: number;
};
