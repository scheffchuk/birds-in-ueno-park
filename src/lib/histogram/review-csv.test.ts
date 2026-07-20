import { describe, expect, it } from "vitest";
import { guideSpeciesToReviewCsv } from "./review-csv";

describe("guideSpeciesToReviewCsv", () => {
  it("exports sciName, common names, and per-season Prevalence", () => {
    const csv = guideSpeciesToReviewCsv([
      {
        sciName: "Passer montanus",
        comNameEn: "Eurasian Tree Sparrow",
        comNameJa: "スズメ",
        comNameZhTw: "麻雀",
        slug: "passer-montanus",
        prevalence: { winter: 80, spring: 70, summer: 60, autumn: 75 },
      },
    ]);
    expect(csv).toBe(
      [
        "sciName,comNameEn,comNameJa,comNameZhTw,winter,spring,summer,autumn",
        "Passer montanus,Eurasian Tree Sparrow,スズメ,麻雀,80,70,60,75",
      ].join("\n") + "\n",
    );
  });

  it("escapes commas and quotes in fields", () => {
    const csv = guideSpeciesToReviewCsv([
      {
        sciName: "X y",
        comNameEn: 'Foo, "Bar"',
        comNameJa: "ア",
        comNameZhTw: "乙",
        slug: "x-y",
        prevalence: { winter: 1, spring: 0, summer: 0, autumn: 0 },
      },
    ]);
    expect(csv).toContain('"Foo, ""Bar"""');
  });
});
