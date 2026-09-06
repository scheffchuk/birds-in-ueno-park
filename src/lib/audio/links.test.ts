import { describe, expect, it } from "vitest";
import { wikipediaUrlForLocale } from "./links";

describe("wikipediaUrlForLocale", () => {
  const links = {
    en: "https://en.wikipedia.org/wiki/Tree_sparrow",
    ja: "https://ja.wikipedia.org/wiki/スズメ",
    zhTw: "https://zh.wikipedia.org/zh-tw/麻雀",
  };

  it("selects the active Locale destination", () => {
    expect(wikipediaUrlForLocale(links, "en")).toBe(links.en);
    expect(wikipediaUrlForLocale(links, "ja")).toBe(links.ja);
    expect(wikipediaUrlForLocale(links, "zh-tw")).toBe(links.zhTw);
  });

  it("falls back to EN when the active Locale destination is empty", () => {
    expect(wikipediaUrlForLocale({ ...links, ja: "" }, "ja")).toBe(links.en);
    expect(wikipediaUrlForLocale({ ...links, zhTw: "" }, "zh-tw")).toBe(
      links.en,
    );
    expect(wikipediaUrlForLocale(undefined, "en")).toBeUndefined();
  });
});
