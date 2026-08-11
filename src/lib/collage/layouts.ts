import { packCollage } from "./pack";
import { SEASON_FILTERS } from "@/lib/season/url";
import { selectForCollage } from "./select";
import type {
  CollageArt,
  CollageLayouts,
  CollageSpecies,
  PackedBird,
  SeasonLayout,
  SeasonTile,
  TileRect,
} from "./types";

/**
 * Stage shapes the collage packs against. Percentages only hold when the stage
 * keeps each canvas aspect; CSS picks between portrait and landscape boxes.
 */
export const COLLAGE_CANVAS = {
  portrait: { width: 600, height: 1000 },
  landscape: { width: 1000, height: 540 },
} as const;

/** Tenths of a percent is sub-pixel on either canvas; the packer leaves 8px of gap. */
function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function toPercent(
  tile: PackedBird,
  canvas: { width: number; height: number },
): TileRect {
  return {
    x: round((tile.x / canvas.width) * 100),
    y: round((tile.y / canvas.height) * 100),
    width: round((tile.width / canvas.width) * 100),
    height: round((tile.height / canvas.height) * 100),
  };
}

function isFiniteRect(rect: TileRect): boolean {
  return (
    Number.isFinite(rect.x) &&
    Number.isFinite(rect.y) &&
    Number.isFinite(rect.width) &&
    Number.isFinite(rect.height) &&
    rect.width > 0 &&
    rect.height > 0
  );
}

const EMPTY_LAYOUT: SeasonLayout = { tiles: [] };

function layoutForSeason(birds: ReturnType<typeof selectForCollage>): SeasonLayout {
  const portrait = packCollage(
    birds,
    COLLAGE_CANVAS.portrait.width,
    COLLAGE_CANVAS.portrait.height,
  );
  const landscape = packCollage(
    birds,
    COLLAGE_CANVAS.landscape.width,
    COLLAGE_CANVAS.landscape.height,
  );
  // Both canvases must agree on the flock, or a tile would have no box on one.
  if (portrait.length === 0 || portrait.length !== landscape.length) {
    return EMPTY_LAYOUT;
  }

  const portraitBySlug = new Map(portrait.map((tile) => [tile.slug, tile]));
  const tiles: SeasonTile[] = [];
  for (const tile of landscape) {
    const other = portraitBySlug.get(tile.slug);
    if (!other) return EMPTY_LAYOUT;
    const portraitRect = toPercent(other, COLLAGE_CANVAS.portrait);
    const landscapeRect = toPercent(tile, COLLAGE_CANVAS.landscape);
    if (!isFiniteRect(portraitRect) || !isFiniteRect(landscapeRect)) {
      return EMPTY_LAYOUT;
    }
    tiles.push({
      slug: tile.slug,
      portrait: portraitRect,
      landscape: landscapeRect,
    });
  }

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
