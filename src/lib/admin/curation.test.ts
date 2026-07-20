import { describe, expect, it } from "vitest";
import {
  planAdminCreateSpecies,
  planAdminNameEdit,
  planAdminPrevalenceEdit,
  planAdminSetListed,
} from "./curation";

describe("planAdminCreateSpecies", () => {
  it("derives slug once, lists the species, and marks name fields curated", () => {
    const planned = planAdminCreateSpecies({
      sciName: "Passer montanus",
      comNameEn: "Eurasian Tree Sparrow",
      comNameJa: "スズメ",
      comNameZhTw: "麻雀",
      prevalence: { winter: 80, spring: 70, summer: 60, autumn: 75 },
    });

    expect(planned).toEqual({
      species: {
        sciName: "Passer montanus",
        comNameEn: "Eurasian Tree Sparrow",
        comNameJa: "スズメ",
        comNameZhTw: "麻雀",
        slug: "passer-montanus",
        listed: true,
        curatedFields: ["sciName", "comNameEn", "comNameJa", "comNameZhTw"],
        illustrationStatus: "queued",
      },
      prevalence: [
        { season: "winter", value: 80, curated: true },
        { season: "spring", value: 70, curated: true },
        { season: "summer", value: 60, curated: true },
        { season: "autumn", value: 75, curated: true },
      ],
    });
  });
});

describe("planAdminNameEdit", () => {
  it("patches changed names and appends them to curatedFields without touching slug", () => {
    const planned = planAdminNameEdit({
      existing: {
        comNameEn: "Old EN",
        comNameJa: "旧",
        comNameZhTw: "舊",
        curatedFields: ["comNameJa"],
      },
      patch: {
        comNameEn: "New EN",
        comNameZhTw: "新",
      },
    });

    expect(planned).toEqual({
      speciesPatch: {
        comNameEn: "New EN",
        comNameZhTw: "新",
        curatedFields: ["comNameJa", "comNameEn", "comNameZhTw"],
      },
    });
  });

  it("no-ops when values are unchanged", () => {
    const planned = planAdminNameEdit({
      existing: {
        comNameEn: "Same",
        comNameJa: "同じ",
        comNameZhTw: "相同",
        curatedFields: [],
      },
      patch: { comNameEn: "Same" },
    });
    expect(planned.speciesPatch).toEqual({});
  });
});

describe("planAdminPrevalenceEdit", () => {
  it("only upserts seasons whose value changed", () => {
    expect(
      planAdminPrevalenceEdit({
        existing: {
          winter: 10,
          spring: 20,
          summer: 30,
          autumn: 40,
        },
        patch: {
          winter: 10,
          summer: 55,
        },
      }),
    ).toEqual([{ season: "summer", value: 55, curated: true }]);
  });

  it("writes all provided seasons when no existing baseline", () => {
    expect(
      planAdminPrevalenceEdit({
        existing: null,
        patch: { winter: 10, summer: 55 },
      }),
    ).toEqual([
      { season: "winter", value: 10, curated: true },
      { season: "summer", value: 55, curated: true },
    ]);
  });
});

describe("planAdminSetListed", () => {
  it("only returns the listed flag", () => {
    expect(planAdminSetListed(false)).toEqual({ listed: false });
    expect(planAdminSetListed(true)).toEqual({ listed: true });
  });
});
