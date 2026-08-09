import { describe, expect, it } from "vitest";
import { FIXTURE_SPECIES } from "@/lib/fixtures/guide-species";
import { buildCollageLayouts } from "./layouts";
import { SEASON_FILTERS } from "./season";
import type { CollageSpecies, SeasonTile } from "./types";

/** Fixture rows carry real Prevalence but no art — give them plausible cutouts. */
const FLOCK: CollageSpecies[] = FIXTURE_SPECIES.map((species, index) => ({
  slug: species.slug,
  sciName: species.sciName,
  comNameEn: species.comNameEn,
  comNameJa: species.comNameJa,
  comNameZhTw: species.comNameZhTw,
  prevalence: species.prevalence,
  url: `https://example.com/${species.slug}.png`,
  aspect: 1.1 + (index % 5) * 0.15,
}));

function overlaps(a: SeasonTile, b: SeasonTile): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

describe("buildCollageLayouts", () => {
  const layouts = buildCollageLayouts(FLOCK);

  it("lists each bird's art once, not once per Season", () => {
    const slugs = layouts.art.map((art) => art.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs.length).toBeLessThanOrEqual(FLOCK.length);
  });

  it("packs every Season", () => {
    for (const season of SEASON_FILTERS) {
      expect(layouts.seasons[season].tiles.length).toBeGreaterThan(0);
    }
  });

  it("keeps tiles inside the canvas without overlap", () => {
    for (const season of SEASON_FILTERS) {
      const { tiles } = layouts.seasons[season];
      for (const tile of tiles) {
        expect(tile.x).toBeGreaterThanOrEqual(0);
        expect(tile.y).toBeGreaterThanOrEqual(0);
        expect(tile.x + tile.width).toBeLessThanOrEqual(100.01);
        expect(tile.y + tile.height).toBeLessThanOrEqual(100.01);
      }
      for (let i = 0; i < tiles.length; i++) {
        for (let j = i + 1; j < tiles.length; j++) {
          expect(overlaps(tiles[i]!, tiles[j]!)).toBe(false);
        }
      }
    }
  });

  it("points every tile at art it can draw", () => {
    const bySlug = new Map(layouts.art.map((art) => [art.slug, art]));
    for (const season of SEASON_FILTERS) {
      for (const tile of layouts.seasons[season].tiles) {
        expect(bySlug.get(tile.slug)?.url).toBeTruthy();
      }
    }
  });

  it("is deterministic", () => {
    expect(buildCollageLayouts(FLOCK)).toEqual(layouts);
  });

  it("returns an empty layout for a flock with no Prevalence", () => {
    const empty = buildCollageLayouts([]);
    expect(empty.art).toEqual([]);
    for (const season of SEASON_FILTERS) {
      expect(empty.seasons[season]).toEqual({ tiles: [] });
    }
  });

  it("skips rows without a drawable cutout instead of packing NaN tiles", () => {
    const broken: CollageSpecies[] = FLOCK.map((bird, index) =>
      index % 2 === 0
        ? { ...bird, url: "", aspect: Number.NaN }
        : bird,
    );
    const layouts = buildCollageLayouts(broken);
    expect(layouts.art.length).toBeGreaterThan(0);
    expect(layouts.art.every((art) => art.url.length > 0)).toBe(true);
    expect(layouts.seasons.all.tiles.length).toBeGreaterThan(0);
  });
});
