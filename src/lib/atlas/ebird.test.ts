import { describe, expect, it } from "vitest";
import { ebirdSpeciesUrl } from "./ebird";

describe("ebirdSpeciesUrl", () => {
  it("builds a direct eBird URL from the official species code", () => {
    expect(ebirdSpeciesUrl("eurtrs1")).toBe(
      "https://ebird.org/species/eurtrs1",
    );
  });
});
