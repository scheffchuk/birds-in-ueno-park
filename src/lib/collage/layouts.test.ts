import { describe, expect, it } from "vitest";
import { FIXTURE_SPECIES } from "@/lib/fixtures/guide-species";
import { buildCollageLayouts } from "./layouts";
import { SEASON_FILTERS } from "./season";
import { tileSizes } from "./tile-sizes";
import type { CollageSpecies, SeasonTile, TileRect } from "./types";

/** Fixture rows carry real Prevalence but no art — give them plausible cutouts. */
const FLOCK: CollageSpecies[] = FIXTURE_SPECIES.map((species, index) => ({
  slug: species.slug,
  sciName: species.sciName,
  comNameEn: species.comNameEn,
  comNameJa: species.comNameJa,
  comNameZhTw: species.comNameZhTw,
  prevalence: species.prevalence,
  perchUrl: `https://example.com/${species.slug}-perch.png`,
  flightUrl: `https://example.com/${species.slug}-flight.png`,
  aspectPerch: 1.1 + (index % 5) * 0.15,
  aspectFlight: 1.4 + (index % 4) * 0.2,
}));

function overlaps(a: TileRect, b: TileRect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function assertCanvas(tiles: SeasonTile[], canvas: "portrait" | "landscape") {
  const rects = tiles.map((tile) => tile[canvas]);
  for (const rect of rects) {
    expect(rect.x).toBeGreaterThanOrEqual(0);
    expect(rect.y).toBeGreaterThanOrEqual(0);
    expect(rect.x + rect.width).toBeLessThanOrEqual(100.01);
    expect(rect.y + rect.height).toBeLessThanOrEqual(100.01);
  }
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      expect(overlaps(rects[i]!, rects[j]!)).toBe(false);
    }
  }
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

  it("keeps tiles inside both canvases without overlap", () => {
    for (const season of SEASON_FILTERS) {
      const { tiles } = layouts.seasons[season];
      assertCanvas(tiles, "portrait");
      assertCanvas(tiles, "landscape");
    }
  });

  it("gives every tile a box on both canvases", () => {
    for (const season of SEASON_FILTERS) {
      for (const tile of layouts.seasons[season].tiles) {
        expect(tile.portrait.width).toBeGreaterThan(0);
        expect(tile.landscape.width).toBeGreaterThan(0);
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

  it("marks a priority tile that exists in the Season", () => {
    for (const season of SEASON_FILTERS) {
      const { tiles, prioritySlug } = layouts.seasons[season];
      expect(tiles.some((tile) => tile.slug === prioritySlug)).toBe(true);
    }
  });

  it("is deterministic", () => {
    expect(buildCollageLayouts(FLOCK)).toEqual(layouts);
  });

  it("returns an empty layout for a flock with no Prevalence", () => {
    const empty = buildCollageLayouts([]);
    expect(empty.art).toEqual([]);
    for (const season of SEASON_FILTERS) {
      expect(empty.seasons[season]).toEqual({ tiles: [], prioritySlug: null });
    }
  });

  it("packs with a fallback aspect when pose aspects are missing", () => {
    // Prerender once hit this: Convex returned rows before aspect* existed, and
    // every tile shipped as NaN% — invisible birds, no error.
    const broken = FLOCK.map((bird) => ({
      ...bird,
      aspectPerch: Number.NaN,
      aspectFlight: 0,
    }));
    const layouts = buildCollageLayouts(broken);
    for (const season of SEASON_FILTERS) {
      const { tiles } = layouts.seasons[season];
      expect(tiles.length).toBeGreaterThan(0);
      for (const tile of tiles) {
        for (const box of [tile.portrait, tile.landscape]) {
          expect(Number.isFinite(box.x)).toBe(true);
          expect(Number.isFinite(box.y)).toBe(true);
          expect(box.width).toBeGreaterThan(0);
          expect(box.height).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe("tileSizes", () => {
  it("asks for a larger source on the wider canvas", () => {
    expect(tileSizes(12, 8)).toBe("(max-width: 767px) 64px, 96px");
  });

  it("quantises so the optimiser sees few distinct widths", () => {
    expect(tileSizes(10, 10)).toBe(tileSizes(10.4, 10.4));
  });
});
