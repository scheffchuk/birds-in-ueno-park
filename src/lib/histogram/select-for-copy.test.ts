import { describe, expect, it } from "vitest";
import { selectSpeciesForCopy } from "./select-for-copy";

describe("selectSpeciesForCopy", () => {
  const species = [
    { slug: "a", sciName: "A a", comNameEn: "A" },
    { slug: "b", sciName: "B b", comNameEn: "B" },
    { slug: "c", sciName: "C c", comNameEn: "C" },
  ];

  it("returns all when limit is omitted", () => {
    expect(selectSpeciesForCopy(species)).toEqual(species);
  });

  it("returns the first N for spot-check", () => {
    expect(selectSpeciesForCopy(species, { limit: 2 })).toEqual([
      species[0],
      species[1],
    ]);
  });

  it("filters to a single slug when provided", () => {
    expect(selectSpeciesForCopy(species, { slug: "b" })).toEqual([species[1]]);
  });
});
