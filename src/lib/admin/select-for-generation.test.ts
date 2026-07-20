import { describe, expect, it } from "vitest";
import { selectSpeciesForGeneration } from "./select-for-generation";

const sample = [
  {
    slug: "a",
    listed: true,
    illustrationStatus: "queued" as const,
    hasAnatomyRef: true,
  },
  {
    slug: "b",
    listed: true,
    illustrationStatus: "failed" as const,
    hasAnatomyRef: true,
  },
  {
    slug: "c",
    listed: true,
    illustrationStatus: "approved" as const,
    hasAnatomyRef: true,
  },
  {
    slug: "d",
    listed: false,
    illustrationStatus: "queued" as const,
    hasAnatomyRef: true,
  },
  {
    slug: "e",
    listed: true,
    illustrationStatus: "queued" as const,
    hasAnatomyRef: false,
  },
  {
    slug: "f",
    listed: true,
    illustrationStatus: "generating" as const,
    hasAnatomyRef: true,
  },
];

describe("selectSpeciesForGeneration", () => {
  it("picks listed species needing art that have anatomy refs", () => {
    expect(selectSpeciesForGeneration(sample).map((s) => s.slug)).toEqual([
      "a",
      "b",
    ]);
  });

  it("caps to the validation slice limit", () => {
    expect(
      selectSpeciesForGeneration(sample, { limit: 1 }).map((s) => s.slug),
    ).toEqual(["a"]);
  });

  it("filters to an explicit slug list when provided", () => {
    expect(
      selectSpeciesForGeneration(sample, { slugs: ["b", "c"] }).map(
        (s) => s.slug,
      ),
    ).toEqual(["b"]);
  });
});
