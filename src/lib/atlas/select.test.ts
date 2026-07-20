import { describe, expect, it } from "vitest";
import { selectForAtlas } from "./select";
import type { SpeciesRecord } from "@/lib/collage/types";

function species(
  overrides: Partial<SpeciesRecord> & Pick<SpeciesRecord, "slug" | "sciName">,
): SpeciesRecord {
  return {
    listed: true,
    illustrationStatus: "approved",
    comNameEn: overrides.sciName,
    comNameJa: overrides.sciName,
    comNameZhTw: overrides.sciName,
    prevalence: { winter: 0, spring: 0, summer: 0, autumn: 0 },
    ...overrides,
  };
}

describe("selectForAtlas", () => {
  const flock: SpeciesRecord[] = [
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
      slug: "pending-art",
      sciName: "Phoenicurus auroreus",
      comNameEn: "Daurian Redstart",
      illustrationStatus: "pendingReview",
      prevalence: { winter: 55, spring: 10, summer: 0, autumn: 20 },
    }),
    species({
      slug: "unlisted",
      sciName: "Pavo cristatus",
      listed: false,
      prevalence: { winter: 99, spring: 99, summer: 99, autumn: 99 },
    }),
  ];

  it("includes Listed species without approved art, sorted by Prevalence desc", () => {
    const rows = selectForAtlas(flock, "winter");
    expect(rows.map((r) => r.slug)).toEqual([
      "passer-montanus",
      "pending-art",
      "anas-platyrhynchos",
    ]);
    expect(rows[0]?.prevalence).toBe(80);
  });

  it("excludes species with Prevalence 0 in the selected Season", () => {
    const rows = selectForAtlas(flock, "summer");
    expect(rows.map((r) => r.slug)).toEqual(["passer-montanus"]);
  });

  it("uses seasonal max Prevalence for All-year", () => {
    const rows = selectForAtlas(flock, "all");
    expect(rows[0]?.slug).toBe("passer-montanus");
    expect(rows[0]?.prevalence).toBe(80);
    expect(rows.some((r) => r.slug === "pending-art")).toBe(true);
  });
});
