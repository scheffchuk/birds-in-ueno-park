import { describe, expect, it } from "vitest";
import { slugFromSciName } from "./slug";

describe("slugFromSciName", () => {
  it("lowercases and hyphenates the scientific name", () => {
    expect(slugFromSciName("Passer montanus")).toBe("passer-montanus");
    expect(slugFromSciName("Aythya baeri")).toBe("aythya-baeri");
  });
});
