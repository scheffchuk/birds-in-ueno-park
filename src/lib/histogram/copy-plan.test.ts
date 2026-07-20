import { describe, expect, it } from "vitest";
import { COPY_FIELDS, planCopyUpsert } from "./copy-plan";

describe("COPY_FIELDS", () => {
  it("lists the six trilingual copy fields", () => {
    expect(COPY_FIELDS).toEqual([
      "descriptionEn",
      "descriptionJa",
      "descriptionZhTw",
      "spottingTipsEn",
      "spottingTipsJa",
      "spottingTipsZhTw",
    ]);
  });
});

describe("planCopyUpsert", () => {
  it("patches non-curated copy fields and skips curated ones", () => {
    const planned = planCopyUpsert({
      incoming: {
        descriptionEn: "New EN",
        descriptionJa: "新しい",
        descriptionZhTw: "新的",
        spottingTipsEn: "Look near water",
        spottingTipsJa: "水辺",
        spottingTipsZhTw: "水邊",
      },
      existing: {
        curatedFields: ["descriptionEn", "spottingTipsJa"],
        descriptionEn: "Hand EN",
        descriptionJa: undefined,
        descriptionZhTw: "舊",
        spottingTipsEn: undefined,
        spottingTipsJa: "手改",
        spottingTipsZhTw: undefined,
      },
    });

    expect(planned.speciesPatch).toEqual({
      descriptionJa: "新しい",
      descriptionZhTw: "新的",
      spottingTipsEn: "Look near water",
      spottingTipsZhTw: "水邊",
      // descriptionEn + spottingTipsJa curated — omitted
    });
  });

  it("no-ops when incoming matches existing", () => {
    const planned = planCopyUpsert({
      incoming: {
        descriptionEn: "Same",
        descriptionJa: "同じ",
        descriptionZhTw: "相同",
        spottingTipsEn: "Tip",
        spottingTipsJa: "ヒント",
        spottingTipsZhTw: "提示",
      },
      existing: {
        curatedFields: [],
        descriptionEn: "Same",
        descriptionJa: "同じ",
        descriptionZhTw: "相同",
        spottingTipsEn: "Tip",
        spottingTipsJa: "ヒント",
        spottingTipsZhTw: "提示",
      },
    });
    expect(planned.speciesPatch).toEqual({});
  });

  it("writes all fields when species has no copy yet", () => {
    const planned = planCopyUpsert({
      incoming: {
        descriptionEn: "EN",
        descriptionJa: "JA",
        descriptionZhTw: "ZH",
        spottingTipsEn: "tip EN",
        spottingTipsJa: "tip JA",
        spottingTipsZhTw: "tip ZH",
      },
      existing: {
        curatedFields: [],
        descriptionEn: undefined,
        descriptionJa: undefined,
        descriptionZhTw: undefined,
        spottingTipsEn: undefined,
        spottingTipsJa: undefined,
        spottingTipsZhTw: undefined,
      },
    });
    expect(planned.speciesPatch).toEqual({
      descriptionEn: "EN",
      descriptionJa: "JA",
      descriptionZhTw: "ZH",
      spottingTipsEn: "tip EN",
      spottingTipsJa: "tip JA",
      spottingTipsZhTw: "tip ZH",
    });
  });
});
