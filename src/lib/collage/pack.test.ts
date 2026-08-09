import { describe, expect, it } from "vitest";
import { packCollage } from "./pack";
import type { CollageBird } from "./types";

function bird(
  slug: string,
  prevalence: number,
  aspect = 1.4,
): CollageBird {
  return {
    slug,
    sciName: slug,
    comNameEn: slug,
    comNameJa: slug,
    comNameZhTw: slug,
    prevalence,
    url: `https://example.com/${slug}.png`,
    aspect,
  };
}

describe("packCollage", () => {
  it("returns no tiles for an empty flock", () => {
    expect(packCollage([], 800, 600)).toEqual([]);
  });

  it("sizes higher-Prevalence birds larger than lower ones", () => {
    const placed = packCollage(
      [bird("common", 90), bird("scarce", 10)],
      800,
      600,
    );
    const common = placed.find((p) => p.slug === "common");
    const scarce = placed.find((p) => p.slug === "scarce");
    expect(common && scarce).toBeTruthy();
    expect(common!.width * common!.height).toBeGreaterThan(
      scarce!.width * scarce!.height,
    );
  });

  it("places every bird fully inside the viewport without overlap", () => {
    const flock = [
      bird("a", 80),
      bird("b", 50),
      bird("c", 30),
      bird("d", 20),
    ];
    const placed = packCollage(flock, 900, 700);
    expect(placed).toHaveLength(4);
    for (const tile of placed) {
      expect(tile.x).toBeGreaterThanOrEqual(0);
      expect(tile.y).toBeGreaterThanOrEqual(0);
      expect(tile.x + tile.width).toBeLessThanOrEqual(900 + 1e-6);
      expect(tile.y + tile.height).toBeLessThanOrEqual(700 + 1e-6);
    }
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        const a = placed[i]!;
        const b = placed[j]!;
        const overlap =
          a.x < b.x + b.width &&
          a.x + a.width > b.x &&
          a.y < b.y + b.height &&
          a.y + a.height > b.y;
        expect(overlap).toBe(false);
      }
    }
  });

  it("is deterministic for the same input", () => {
    const flock = [bird("x", 40), bird("y", 60), bird("z", 25)];
    expect(packCollage(flock, 640, 480)).toEqual(packCollage(flock, 640, 480));
  });
});
