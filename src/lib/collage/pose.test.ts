import { describe, expect, it } from "vitest";
import { collagePose } from "./pose";
import type { CollageSpecies } from "./types";

function species(slug: string): CollageSpecies {
  return {
    slug,
    sciName: slug,
    comNameEn: slug,
    comNameJa: slug,
    comNameZhTw: slug,
    prevalence: { winter: 50, spring: 50, summer: 50, autumn: 50 },
    perchUrl: `https://example.com/${slug}-perch.png`,
    flightUrl: `https://example.com/${slug}-flight.png`,
    aspectPerch: 1.2,
    aspectFlight: 1.8,
  };
}

const SLUGS = [
  "passer-montanus",
  "anas-platyrhynchos",
  "hirundo-rustica",
  "alcedo-atthis",
  "parus-minor",
  "corvus-corone",
];

describe("collagePose", () => {
  it("pairs each URL with the aspect of that same pose", () => {
    for (const slug of SLUGS) {
      const bird = species(slug);
      const { url, aspect } = collagePose(bird);
      expect(aspect).toBe(
        url === bird.flightUrl ? bird.aspectFlight : bird.aspectPerch,
      );
    }
  });

  it("picks the same pose for a Slug every time", () => {
    for (const slug of SLUGS) {
      expect(collagePose(species(slug))).toEqual(collagePose(species(slug)));
    }
  });

  it("uses both poses across the flock", () => {
    const urls = SLUGS.map((slug) => {
      const bird = species(slug);
      return collagePose(bird).url === bird.flightUrl ? "flight" : "perch";
    });
    expect(new Set(urls)).toEqual(new Set(["perch", "flight"]));
  });
});
