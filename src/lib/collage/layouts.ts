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

/**
 * Stage shapes the collage packs against. Percentages only hold their spacing
 * when the stage keeps the canvas aspect, and a phone is nowhere near a
 * desktop's, so each gets its own pack and CSS picks between them.
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
) {
  return {
    x: round((tile.x / canvas.width) * 100),
    y: round((tile.y / canvas.height) * 100),
    width: round((tile.width / canvas.width) * 100),
    height: round((tile.height / canvas.height) * 100),
  };
}

function isFiniteRect(rect: { x: number; y: number; width: number; height: number }) {
  return (
    Number.isFinite(rect.x) &&
    Number.isFinite(rect.y) &&
    Number.isFinite(rect.width) &&
    Number.isFinite(rect.height) &&
    rect.width > 0 &&
    rect.height > 0
  );
}

function largestSlug(placed: PackedBird[]): string | null {
  let best: PackedBird | null = null;
  let bestArea = 0;
  for (const tile of placed) {
    const area = tile.width * tile.height;
    if (area > bestArea) {
      bestArea = area;
      best = tile;
    }
  }
  return best?.slug ?? null;
}

const EMPTY_LAYOUT: SeasonLayout = { tiles: [], prioritySlug: null };

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
    const portraitBox = toPercent(other, COLLAGE_CANVAS.portrait);
    const landscapeBox = toPercent(tile, COLLAGE_CANVAS.landscape);
    // Never ship NaN% CSS vars — the stage renders blank with no console error.
    if (!isFiniteRect(portraitBox) || !isFiniteRect(landscapeBox)) {
      return EMPTY_LAYOUT;
    }
    tiles.push({
      slug: tile.slug,
      portrait: portraitBox,
      landscape: landscapeBox,
    });
  }

  return { tiles, prioritySlug: largestSlug(landscape) };
}

/**
 * Pack every Season up front so the client can switch without a roundtrip and
 * without shipping the packer. Art is listed once and referenced by Slug —
 * repeating names and URLs per Season would dwarf the layouts themselves.
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
