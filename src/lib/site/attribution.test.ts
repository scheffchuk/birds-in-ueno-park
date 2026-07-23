import { describe, expect, it } from "vitest";
import { ABOUT_SECTIONS, SITE_FOOTER } from "./attribution";

describe("site attribution", () => {
  it("footer credits AvianVisitors and theodore.net", () => {
    expect(SITE_FOOTER.credit).toMatch(/AvianVisitors/);
    expect(SITE_FOOTER.creditUrl).toMatch(/AvianVisitors/);
    expect(SITE_FOOTER.creditSite).toBe("theodore.net");
    expect(SITE_FOOTER.creditSiteUrl).toMatch(/theodore\.net/);
  });

  it("about sections are EN+JA only with required topics", () => {
    const ids = ABOUT_SECTIONS.map((s) => s.id);
    expect(ids).toEqual(["collage", "data", "art"]);
    for (const section of ABOUT_SECTIONS) {
      expect(section.titleEn.length).toBeGreaterThan(0);
      expect(section.titleJa.length).toBeGreaterThan(0);
      expect(section.bodyEn.length).toBeGreaterThan(40);
      expect(section.bodyJa.length).toBeGreaterThan(40);
      expect(JSON.stringify(section)).not.toMatch(/繁體|ZH-TW|ZhTw/i);
    }
  });
});
