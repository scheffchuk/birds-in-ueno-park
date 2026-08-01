import { describe, expect, it } from "vitest";
import en from "../../../messages/en.json";
import ja from "../../../messages/ja.json";
import zhTw from "../../../messages/zh-TW.json";
import { SITE_FOOTER } from "./attribution";

describe("site attribution", () => {
  it("footer credits AvianVisitors, theodore.net, and author", () => {
    expect(SITE_FOOTER.creditName).toBe("AvianVisitors");
    expect(SITE_FOOTER.creditUrl).toMatch(/AvianVisitors/);
    expect(SITE_FOOTER.creditSite).toBe("theodore.net");
    expect(SITE_FOOTER.creditSiteUrl).toMatch(/theodore\.net/);
    expect(SITE_FOOTER.author).toBe("ScheffChuk");
    expect(SITE_FOOTER.authorUrl).toMatch(/scheff\.dev/);
  });

  it("about message catalogs cover collage, data, and art in all Locales", () => {
    for (const catalog of [en, ja, zhTw]) {
      const sections = catalog.About.sections;
      expect(Object.keys(sections)).toEqual(["collage", "data", "art"]);
      for (const section of Object.values(sections)) {
        expect(section.title.length).toBeGreaterThan(0);
        expect(section.body.length).toBeGreaterThan(40);
      }
    }
  });
});
