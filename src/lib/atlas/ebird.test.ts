import { describe, expect, it } from "vitest";
import { ebirdSpeciesUrl } from "./ebird";

describe("ebirdSpeciesUrl", () => {
  it("builds a searchable eBird URL from the scientific name", () => {
    expect(ebirdSpeciesUrl("Passer montanus")).toBe(
      "https://ebird.org/search?keyword=Passer%20montanus",
    );
  });
});
