import { describe, expect, it } from "vitest";
import { planAdminCopyEdit } from "./curation";

describe("planAdminCopyEdit", () => {
  it("patches changed copy fields and appends them to curatedFields", () => {
    const planned = planAdminCopyEdit({
      existing: {
        descriptionEn: "Old",
        descriptionJa: undefined,
        descriptionZhTw: "舊",
        spottingTipsEn: "tip",
        spottingTipsJa: undefined,
        spottingTipsZhTw: undefined,
        curatedFields: ["descriptionEn"],
      },
      patch: {
        descriptionEn: "New",
        descriptionJa: "新しい",
        spottingTipsEn: "tip",
      },
    });

    expect(planned.speciesPatch).toEqual({
      descriptionEn: "New",
      descriptionJa: "新しい",
      curatedFields: ["descriptionEn", "descriptionJa"],
    });
  });

  it("no-ops when values are unchanged", () => {
    const planned = planAdminCopyEdit({
      existing: {
        descriptionEn: "Same",
        descriptionJa: undefined,
        descriptionZhTw: undefined,
        spottingTipsEn: undefined,
        spottingTipsJa: undefined,
        spottingTipsZhTw: undefined,
        curatedFields: [],
      },
      patch: { descriptionEn: "Same" },
    });
    expect(planned.speciesPatch).toEqual({});
  });
});
