import { describe, expect, it } from "vitest";
import {
  explainEmptyGenerationSelection,
  selectSpeciesForGeneration,
} from "./select-for-generation";

const sample = [
  {
    slug: "a",
    listed: true,
    illustrationStatus: "queued" as const,
    hasAnatomyRef: true,
    hasFlightAnatomyRef: true,
    hasCutoutPair: false,
  },
  {
    slug: "b",
    listed: true,
    illustrationStatus: "failed" as const,
    hasAnatomyRef: true,
    hasFlightAnatomyRef: true,
    hasCutoutPair: false,
  },
  {
    slug: "c",
    listed: true,
    illustrationStatus: "approved" as const,
    hasAnatomyRef: true,
    hasFlightAnatomyRef: true,
    hasCutoutPair: true,
  },
  {
    slug: "d",
    listed: false,
    illustrationStatus: "queued" as const,
    hasAnatomyRef: true,
    hasFlightAnatomyRef: true,
    hasCutoutPair: false,
  },
  {
    slug: "e",
    listed: true,
    illustrationStatus: "queued" as const,
    hasAnatomyRef: false,
    hasFlightAnatomyRef: false,
    hasCutoutPair: false,
  },
  {
    slug: "f",
    listed: true,
    illustrationStatus: "generating" as const,
    hasAnatomyRef: true,
    hasFlightAnatomyRef: true,
    hasCutoutPair: false,
  },
  {
    slug: "g",
    listed: true,
    illustrationStatus: "approved" as const,
    hasAnatomyRef: true,
    hasFlightAnatomyRef: true,
    hasCutoutPair: false,
  },
  {
    slug: "h",
    listed: true,
    illustrationStatus: "queued" as const,
    hasAnatomyRef: true,
    hasFlightAnatomyRef: false,
    hasCutoutPair: false,
  },
];

describe("selectSpeciesForGeneration", () => {
  it("picks listed species needing art that have both anatomy refs", () => {
    expect(selectSpeciesForGeneration(sample).map((s) => s.slug)).toEqual([
      "a",
      "b",
      "f",
      "g",
    ]);
  });

  it("excludes species missing flight anatomy", () => {
    expect(
      selectSpeciesForGeneration(sample).map((s) => s.slug),
    ).not.toContain("h");
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

  it("includes approved-without-cutouts", () => {
    expect(
      selectSpeciesForGeneration(sample).map((s) => s.slug),
    ).toContain("g");
  });

  it("excludes truly approved cutout pairs", () => {
    expect(
      selectSpeciesForGeneration(sample).map((s) => s.slug),
    ).not.toContain("c");
  });
});

describe("explainEmptyGenerationSelection", () => {
  it("mentions approved without cutouts", () => {
    const msg = explainEmptyGenerationSelection([
      {
        slug: "x",
        listed: true,
        illustrationStatus: "approved",
        hasAnatomyRef: true,
        hasFlightAnatomyRef: true,
        hasCutoutPair: false,
      },
    ]);
    expect(msg).toMatch(/without cutouts/i);
  });

  it("mentions missing flight anatomy", () => {
    const msg = explainEmptyGenerationSelection([
      {
        slug: "y",
        listed: true,
        illustrationStatus: "queued",
        hasAnatomyRef: true,
        hasFlightAnatomyRef: false,
        hasCutoutPair: false,
      },
    ]);
    expect(msg).toMatch(/missing flight anatomy 1/i);
    expect(msg).toMatch(/flight anatomy first/i);
  });
});
