import { describe, expect, it } from "vitest";
import { selectForCollage } from "./select";
import type { SpeciesRecord, Season } from "./types";

function species(
  overrides: Partial<SpeciesRecord> & Pick<SpeciesRecord, "slug" | "sciName">,
): SpeciesRecord {
  return {
    listed: true,
    illustrationStatus: "approved",
    comNameEn: overrides.sciName,
    comNameJa: overrides.sciName,
    comNameZhTw: overrides.sciName,
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
      slug: "zoo-escape",
      sciName: "Pavo cristatus",
      listed: false,
      prevalence: { winter: 90, spring: 90, summer: 90, autumn: 90 },
    }),
    species({
      slug: "pending-art",
      sciName: "Parus minor",
      illustrationStatus: "pendingReview",
      prevalence: { winter: 40, spring: 40, summer: 40, autumn: 40 },
    }),
    species({
      slug: "summer-only",
      sciName: "Hirundo rustica",
      prevalence: { winter: 0, spring: 5, summer: 55, autumn: 15 },
    }),
  ];

  it("includes only Listed approved species with Prevalence > 0 for the Season", () => {
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
    const onlyPending = selectForCollage(
      [
        species({
          slug: "x",
          sciName: "X x",
          illustrationStatus: "generating",
          prevalence: { winter: 10, spring: 10, summer: 10, autumn: 10 },
        }),
      ],
      "winter" satisfies Season,
    );
    expect(onlyPending).toEqual([]);
  });
});
