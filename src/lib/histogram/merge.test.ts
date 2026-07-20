import { describe, expect, it } from "vitest";
import { mergeHistogramsMax } from "./merge";
import type { WeeklyHistogram } from "./parse";

const a: WeeklyHistogram = {
  sciName: "Passer montanus",
  comNameEn: "Eurasian Tree Sparrow",
  weeks: Array.from({ length: 48 }, (_, i) => (i === 0 ? 0.4 : 0)),
};

const b: WeeklyHistogram = {
  sciName: "Passer montanus",
  comNameEn: "Eurasian Tree Sparrow",
  weeks: Array.from({ length: 48 }, (_, i) => (i === 0 ? 0.7 : i === 1 ? 0.2 : 0)),
};

const onlyB: WeeklyHistogram = {
  sciName: "Hirundo rustica",
  comNameEn: "Barn Swallow",
  weeks: Array.from({ length: 48 }, (_, i) => (i === 20 ? 0.5 : 0)),
};

describe("mergeHistogramsMax", () => {
  it("takes per-week max across hotspots and unions species", () => {
    const merged = mergeHistogramsMax([a], [b, onlyB]);
    expect(merged).toHaveLength(2);
    const sparrow = merged.find((r) => r.sciName === "Passer montanus")!;
    expect(sparrow.weeks[0]).toBe(0.7);
    expect(sparrow.weeks[1]).toBe(0.2);
    expect(merged.find((r) => r.sciName === "Hirundo rustica")?.weeks[20]).toBe(
      0.5,
    );
  });
});
