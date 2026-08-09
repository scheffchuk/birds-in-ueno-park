import { describe, expect, it } from "vitest";
import { selectForCollage } from "./select";
import type { CollageSpecies, Season } from "./types";

function species(
  overrides: Partial<CollageSpecies> & Pick<CollageSpecies, "slug" | "sciName">,
): CollageSpecies {
  return {
    comNameEn: overrides.sciName,
    comNameJa: overrides.sciName,
    comNameZhTw: overrides.sciName,
    perchUrl: `https://example.com/${overrides.slug}-perch.png`,
    flightUrl: `https://example.com/${overrides.slug}-flight.png`,
    aspectPerch: 1.2,
    aspectFlight: 1.8,
    prevalence: {
      winter: 0,
      spring: 0,
      summer: 0,
      autumn: 0,
    },
    ...overrides,
  };
}

describe("selectForCollage", () => {
  const flock: CollageSpecies[] = [
    species({
      slug: "passer-montanus",
      sciName: "Passer montanus",
      comNameEn: "Eurasian Tree Sparrow",
      prevalence: { winter: 80, spring: 70, summer: 60, autumn: 75 },
    }),
    species({
      slug: "anas-platyrhynchos",
      sciName: "Anas platyrhynchos",
      comNameEn: "Mallard",
      prevalence: { winter: 50, spring: 10, summer: 0, autumn: 20 },
    }),
    species({
      slug: "summer-only",
      sciName: "Hirundo rustica",
      prevalence: { winter: 0, spring: 5, summer: 55, autumn: 15 },
    }),
  ];

  it("carries the Season's Prevalence for each included bird", () => {
    const winter = selectForCollage(flock, "winter");
    expect(winter.map((b) => b.slug)).toEqual([
      "passer-montanus",
      "anas-platyrhynchos",
    ]);
    expect(winter.find((b) => b.slug === "passer-montanus")?.prevalence).toBe(
      80,
    );
  });

  it("excludes species with Prevalence 0 in the selected Season", () => {
    const summer = selectForCollage(flock, "summer");
    expect(summer.map((b) => b.slug)).toEqual([
      "passer-montanus",
      "summer-only",
    ]);
  });

  it("uses seasonal max Prevalence for All-year", () => {
    const allYear = selectForCollage(flock, "all");
    const mallard = allYear.find((b) => b.slug === "anas-platyrhynchos");
    expect(mallard?.prevalence).toBe(50);
    expect(allYear.map((b) => b.slug)).toEqual([
      "passer-montanus",
      "anas-platyrhynchos",
      "summer-only",
    ]);
  });

  it("returns an empty list when nothing qualifies", () => {
    const absent = selectForCollage(
      [species({ slug: "x", sciName: "X x" })],
      "winter" satisfies Season,
    );
    expect(absent).toEqual([]);
  });

  it("resolves one pose per bird, aspect matching the chosen URL", () => {
    for (const bird of selectForCollage(flock, "all")) {
      const source = flock.find((s) => s.slug === bird.slug)!;
      const expected =
        bird.url === source.flightUrl
          ? source.aspectFlight
          : source.aspectPerch;
      expect([source.perchUrl, source.flightUrl]).toContain(bird.url);
      expect(bird.aspect).toBe(expected);
    }
  });
});
