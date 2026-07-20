import { describe, expect, it } from "vitest";
import { trimGuideSpecies } from "./trim";
import type { SeedCandidate } from "./types";

function candidate(
  partial: Partial<SeedCandidate> & Pick<SeedCandidate, "sciName" | "comNameEn">,
): SeedCandidate {
  return {
    comNameJa: partial.comNameJa ?? partial.comNameEn,
    comNameZhTw: partial.comNameZhTw ?? partial.comNameEn,
    exotic: partial.exotic ?? null,
    weeksNonZero: partial.weeksNonZero ?? 10,
    maxWeekFreq: partial.maxWeekFreq ?? 0.5,
    prevalence: partial.prevalence ?? {
      winter: 40,
      spring: 40,
      summer: 40,
      autumn: 40,
    },
    ...partial,
  };
}

describe("trimGuideSpecies", () => {
  it("drops Escapees and one-off vagrants; keeps multi-season Naturalized", () => {
    const kept = trimGuideSpecies([
      candidate({ sciName: "Passer montanus", comNameEn: "Eurasian Tree Sparrow" }),
      candidate({
        sciName: "Acridotheres tristis",
        comNameEn: "Common Myna",
        exotic: "Exotic: Escapee",
      }),
      candidate({
        sciName: "Columba livia",
        comNameEn: "Rock Pigeon",
        exotic: "Exotic: Naturalized",
        prevalence: { winter: 80, spring: 80, summer: 80, autumn: 80 },
      }),
      candidate({
        sciName: "Garrulax canorus",
        comNameEn: "Chinese Hwamei",
        exotic: "Exotic: Naturalized",
        prevalence: { winter: 5, spring: 0, summer: 0, autumn: 0 },
      }),
      candidate({
        sciName: "Aythya baeri",
        comNameEn: "Baer's Pochard",
        weeksNonZero: 1,
        maxWeekFreq: 0.0015,
        prevalence: { winter: 0, spring: 0, summer: 0, autumn: 0 },
      }),
    ]);
    expect(kept.map((s) => s.sciName).sort()).toEqual([
      "Columba livia",
      "Passer montanus",
    ]);
  });
});
