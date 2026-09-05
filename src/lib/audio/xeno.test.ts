import { describe, expect, it } from "vitest";
import { xenoCantoQueryForSpecies } from "./xeno";

describe("xenoCantoQueryForSpecies", () => {
  it("uses v3 taxonomic tags for a binomial scientific name", () => {
    expect(xenoCantoQueryForSpecies("Passer montanus")).toBe(
      "gen:Passer sp:montanus",
    );
  });

  it("rejects names that cannot be made into a species query", () => {
    expect(() => xenoCantoQueryForSpecies("Passer")).toThrow(
      "binomial scientific name",
    );
  });
});
