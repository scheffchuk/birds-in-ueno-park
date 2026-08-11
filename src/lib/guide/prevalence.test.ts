import { describe, expect, it } from "vitest";
import { prevalenceForFilter } from "./prevalence";

const prevalence = {
  winter: 10,
  spring: 40,
  summer: 80,
  autumn: 25,
};

describe("prevalenceForFilter", () => {
  it("returns the Season bucket for a meteorological Season", () => {
    expect(prevalenceForFilter({ prevalence }, "winter")).toBe(10);
    expect(prevalenceForFilter({ prevalence }, "spring")).toBe(40);
    expect(prevalenceForFilter({ prevalence }, "summer")).toBe(80);
    expect(prevalenceForFilter({ prevalence }, "autumn")).toBe(25);
  });

  it("returns seasonal-max Prevalence for All-year", () => {
    expect(prevalenceForFilter({ prevalence }, "all")).toBe(80);
  });

  it("returns 0 when the Season bucket is absent", () => {
    expect(
      prevalenceForFilter(
        { prevalence: { winter: 0, spring: 0, summer: 0, autumn: 0 } },
        "summer",
      ),
    ).toBe(0);
  });
});
