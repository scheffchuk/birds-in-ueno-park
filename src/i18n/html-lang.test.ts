import { describe, expect, it } from "vitest";
import { toHtmlLang } from "./html-lang";

describe("toHtmlLang", () => {
  it("maps each Locale to a BCP-47 html lang", () => {
    expect(toHtmlLang("ja")).toBe("ja");
    expect(toHtmlLang("en")).toBe("en");
    expect(toHtmlLang("zh-tw")).toBe("zh-Hant-TW");
  });
});
