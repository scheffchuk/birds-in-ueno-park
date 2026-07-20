import { describe, expect, it } from "vitest";
import { planSpeciesUpsert } from "./seed-plan";

describe("planSpeciesUpsert", () => {
  it("skips curated fields, never patches listed, sets defaults for new rows", () => {
    const planned = planSpeciesUpsert({
      incoming: {
        sciName: "Passer montanus",
        comNameEn: "Eurasian Tree Sparrow",
        comNameJa: "スズメ",
        comNameZhTw: "麻雀",
        slug: "passer-montanus",
        prevalence: { winter: 80, spring: 70, summer: 60, autumn: 75 },
      },
      existing: {
        slug: "passer-montanus",
        listed: false,
        curatedFields: ["comNameZhTw", "comNameEn"],
        comNameEn: "Hand EN",
        comNameJa: "旧",
        comNameZhTw: "手改",
        sciName: "Passer montanus",
      },
      existingPrevalence: {
        winter: { value: 10, curated: true },
        spring: { value: 20, curated: false },
      },
    });

    expect(planned.speciesPatch).toEqual({
      comNameJa: "スズメ",
      // sciName unchanged; comNameEn + comNameZhTw curated — omitted
    });
    expect(planned.touchListed).toBe(false);
    expect(planned.prevalenceUpserts).toEqual([
      { season: "spring", value: 70 },
      { season: "summer", value: 60 },
      { season: "autumn", value: 75 },
      // winter curated — skipped
    ]);
  });

  it("defaults listed true and illustrationStatus approved for new species", () => {
    const planned = planSpeciesUpsert({
      incoming: {
        sciName: "Hirundo rustica",
        comNameEn: "Barn Swallow",
        comNameJa: "ツバメ",
        comNameZhTw: "家燕",
        slug: "hirundo-rustica",
        prevalence: { winter: 0, spring: 25, summer: 65, autumn: 30 },
      },
      existing: null,
      existingPrevalence: {},
    });
    expect(planned.insert).toMatchObject({
      listed: true,
      illustrationStatus: "approved",
      curatedFields: [],
      slug: "hirundo-rustica",
    });
  });
});
