import type { SeasonFilter } from "@/lib/season/types";
import type { SeasonalPrevalence } from "@/lib/guide/types";

/** Row from `listForCollage` — one cutout URL + aspect, ready to pack. */
export type CollageSpecies = {
  slug: string;
  sciName: string;
  comNameEn: string;
  comNameJa: string;
  comNameZhTw: string;
  prevalence: SeasonalPrevalence;
  url: string;
  aspect: number;
};

export type CollageBird = {
  slug: string;
  sciName: string;
  comNameEn: string;
  comNameJa: string;
  comNameZhTw: string;
  /** Prevalence for the selected Season filter (0–100). */
  prevalence: number;
  url: string;
  aspect: number;
};

export type PackedBird = CollageBird & {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Tile box as a percentage of the canvas it was packed against. */
export type TileRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type SeasonTile = {
  slug: string;
  portrait: TileRect;
  landscape: TileRect;
};

export type SeasonLayout = {
  tiles: SeasonTile[];
};

/** Everything needed to draw a tile, listed once and shared across Seasons. */
export type CollageArt = {
  slug: string;
  comNameEn: string;
  comNameJa: string;
  comNameZhTw: string;
  url: string;
};

export type CollageLayouts = {
  art: CollageArt[];
  seasons: Record<SeasonFilter, SeasonLayout>;
};
