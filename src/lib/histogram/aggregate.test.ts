import { describe, expect, it } from "vitest";
import { weeksToSeasonalPrevalence } from "./aggregate";

describe("weeksToSeasonalPrevalence", () => {
  it("aggregates meteorological seasons via max week, scaled 0–100", () => {
    // week indices: Jan0=0 … Dec4=47
    const weeks = Array(48).fill(0) as number[];
    weeks[0] = 0.4; // Jan → winter
    weeks[10] = 0.25; // Mar → spring
    weeks[22] = 0.6; // Jun → summer
    weeks[34] = 0.1; // Sep → autumn
    weeks[46] = 0.55; // Dec → winter (max with Jan)

    expect(weeksToSeasonalPrevalence(weeks)).toEqual({
      winter: 55,
      spring: 25,
      summer: 60,
      autumn: 10,
    });
  });
});
