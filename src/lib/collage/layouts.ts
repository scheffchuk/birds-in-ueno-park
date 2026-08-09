import { packCollage } from "./pack";
import { SEASON_FILTERS } from "./season";
import { selectForCollage } from "./select";
import type {
  CollageArt,
  CollageLayouts,
  CollageSpecies,
  PackedBird,
  SeasonLayout,
  SeasonTile,
} from "./types";

/** Single pack canvas — stage CSS keeps this aspect and contains it in the slot. */
export const COLLAGE_CANVAS = { width: 1000, height: 540 } as const;

/** Tenths of a percent is sub-pixel on the canvas; the packer leaves 8px of gap. */
function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function toPercent(tile: PackedBird): SeasonTile {
  return {
    slug: tile.slug,
    x: round((tile.x / COLLAGE_CANVAS.width) * 100),
    y: round((tile.y / COLLAGE_CANVAS.height) * 100),
    width: round((tile.width / COLLAGE_CANVAS.width) * 100),
    height: round((tile.height / COLLAGE_CANVAS.height) * 100),
  };
}

function isFiniteTile(tile: SeasonTile): boolean {
  return (
    Number.isFinite(tile.x) &&
    Number.isFinite(tile.y) &&
    Number.isFinite(tile.width) &&
    Number.isFinite(tile.height) &&
    tile.width > 0 &&
    tile.height > 0
  );
}

const EMPTY_LAYOUT: SeasonLayout = { tiles: [] };

function layoutForSeason(birds: ReturnType<typeof selectForCollage>): SeasonLayout {
  const placed = packCollage(
    birds,
    COLLAGE_CANVAS.width,
    COLLAGE_CANVAS.height,
  );
  if (placed.length === 0) return EMPTY_LAYOUT;

  const tiles = placed.map(toPercent);
  if (tiles.some((tile) => !isFiniteTile(tile))) return EMPTY_LAYOUT;
  return { tiles };
}

/**
 * Pack every Season up front so the client can switch without a roundtrip and
 * without shipping the packer. Art is listed once and referenced by Slug.
 */
export function buildCollageLayouts(species: CollageSpecies[]): CollageLayouts {
  const art = new Map<string, CollageArt>();
  const seasons = {} as CollageLayouts["seasons"];

  for (const season of SEASON_FILTERS) {
    const birds = selectForCollage(species, season);
    for (const bird of birds) {
      art.set(bird.slug, {
        slug: bird.slug,
        comNameEn: bird.comNameEn,
        comNameJa: bird.comNameJa,
        comNameZhTw: bird.comNameZhTw,
        url: bird.url,
      });
    }
    seasons[season] = layoutForSeason(birds);
  }

  return { art: [...art.values()], seasons };
}
