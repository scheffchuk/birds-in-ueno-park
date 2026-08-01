import { describe, expect, it } from "vitest";
import {
  commonNameForLocale,
  longFormForLocale,
  nameStackForLocale,
} from "./species";

const names = {
  comNameEn: "Eurasian Tree Sparrow",
  comNameJa: "スズメ",
  comNameZhTw: "樹麻雀",
  sciName: "Passer montanus",
};

describe("commonNameForLocale", () => {
  it("returns the Locale common name", () => {
    expect(commonNameForLocale(names, "ja")).toBe("スズメ");
    expect(commonNameForLocale(names, "en")).toBe("Eurasian Tree Sparrow");
    expect(commonNameForLocale(names, "zh-TW")).toBe("樹麻雀");
  });
});

describe("longFormForLocale", () => {
  const copy = {
    descriptionEn: "English prose",
    descriptionJa: "日本語の文章",
    descriptionZhTw: "繁體中文",
  };

  it("returns the Locale field when present", () => {
    expect(longFormForLocale(copy, "description", "ja")).toBe("日本語の文章");
    expect(longFormForLocale(copy, "description", "zh-TW")).toBe("繁體中文");
  });

  it("falls back to EN only when Locale field is empty", () => {
    expect(
      longFormForLocale(
        { descriptionEn: "English prose", descriptionJa: "  " },
        "description",
        "ja",
      ),
    ).toBe("English prose");
  });

  it("never falls back to a third Locale", () => {
    expect(
      longFormForLocale(
        { descriptionJa: "日本語の文章", descriptionZhTw: "繁體中文" },
        "description",
        "en",
      ),
    ).toBeUndefined();
  });

  it("returns undefined when Locale and EN are both empty", () => {
    expect(
      longFormForLocale({ descriptionZhTw: "繁體中文" }, "description", "ja"),
    ).toBeUndefined();
  });
});

describe("nameStackForLocale", () => {
  it("puts Locale name first, EN first among secondaries when Locale is not EN", () => {
    expect(nameStackForLocale(names, "ja")).toEqual({
      primary: "スズメ",
      secondary: ["Eurasian Tree Sparrow", "樹麻雀"],
      scientific: "Passer montanus",
    });
  });

  it("orders ZH-TW primary with EN then JA as secondaries", () => {
    expect(nameStackForLocale(names, "zh-TW")).toEqual({
      primary: "樹麻雀",
      secondary: ["Eurasian Tree Sparrow", "スズメ"],
      scientific: "Passer montanus",
    });
  });

  it("orders EN primary with JA then ZH-TW as secondaries", () => {
    expect(nameStackForLocale(names, "en")).toEqual({
      primary: "Eurasian Tree Sparrow",
      secondary: ["スズメ", "樹麻雀"],
      scientific: "Passer montanus",
    });
  });
});
