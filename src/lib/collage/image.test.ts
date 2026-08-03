import { describe, expect, it } from "vitest";
import { COLLAGE_IMAGE_SIZES, largestIllustratedTileSlug } from "./image";
import type { PackedBird } from "./types";

function tile(
  overrides: Partial<PackedBird> & Pick<PackedBird, "slug" | "width" | "height">,
): PackedBird {
  return {
    sciName: overrides.slug,
    comNameEn: overrides.slug,
    comNameJa: overrides.slug,
    comNameZhTw: overrides.slug,
    prevalence: 50,
    perchUrl: "https://example.com/perch.png",
    flightUrl: "https://example.com/flight.png",
    x: 0,
    y: 0,
    ...overrides,
  };
}

describe("COLLAGE_IMAGE_SIZES", () => {
  it("is the shared 120px collage sizes string", () => {
    expect(COLLAGE_IMAGE_SIZES).toBe("120px");
  });
});

describe("largestIllustratedTileSlug", () => {
  it("returns the Slug of the largest illustrated tile by area", () => {
    const slug = largestIllustratedTileSlug([
      tile({ slug: "small", width: 40, height: 40 }),
      tile({ slug: "large", width: 120, height: 100 }),
      tile({ slug: "medium", width: 80, height: 80 }),
    ]);
    expect(slug).toBe("large");
  });

  it("skips tiles with no pose URL", () => {
    const slug = largestIllustratedTileSlug([
      tile({
        slug: "empty",
        width: 200,
        height: 200,
        perchUrl: undefined,
        flightUrl: undefined,
      }),
      tile({ slug: "art", width: 50, height: 50 }),
    ]);
    expect(slug).toBe("art");
  });

  it("returns null when nothing is illustrated", () => {
    expect(largestIllustratedTileSlug([])).toBeNull();
  });
});
