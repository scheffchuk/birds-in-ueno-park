import { describe, expect, it } from "vitest";
import { findListedBySlug } from "./find";
import type { SpeciesRecord } from "@/lib/collage/types";

function species(
  overrides: Partial<SpeciesRecord> & Pick<SpeciesRecord, "slug" | "sciName">,
): SpeciesRecord {
  return {
    listed: true,
    illustrationStatus: "approved",
    comNameEn: overrides.sciName,
    comNameJa: overrides.sciName,
    comNameZhTw: overrides.sciName,
    prevalence: { winter: 10, spring: 10, summer: 10, autumn: 10 },
    ...overrides,
  };
}

describe("findListedBySlug", () => {
  const flock = [
    species({ slug: "passer-montanus", sciName: "Passer montanus" }),
    species({
      slug: "hidden",
      sciName: "Pavo cristatus",
      listed: false,
    }),
  ];

  it("returns the Listed species for a stable Slug", () => {
    expect(findListedBySlug(flock, "passer-montanus")?.sciName).toBe(
      "Passer montanus",
    );
  });

  it("returns null for Unlisted species (public not-found)", () => {
    expect(findListedBySlug(flock, "hidden")).toBeNull();
  });

  it("returns null for unknown Slugs", () => {
    expect(findListedBySlug(flock, "nope")).toBeNull();
  });
});
