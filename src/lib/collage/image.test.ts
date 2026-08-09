import { describe, expect, it } from "vitest";
import { largestTileSlug } from "./image";
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
    url: `https://example.com/${overrides.slug}.png`,
    aspect: 1.4,
    x: 0,
    y: 0,
    ...overrides,
  };
}

describe("largestTileSlug", () => {
  it("returns the Slug of the largest tile by area", () => {
    const slug = largestTileSlug([
      tile({ slug: "small", width: 40, height: 40 }),
      tile({ slug: "large", width: 120, height: 100 }),
      tile({ slug: "medium", width: 80, height: 80 }),
    ]);
    expect(slug).toBe("large");
  });

  it("returns null for an empty stage", () => {
    expect(largestTileSlug([])).toBeNull();
  });
});
