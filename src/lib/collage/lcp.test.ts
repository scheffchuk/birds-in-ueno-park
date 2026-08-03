import { describe, expect, it } from "vitest";
import { pickCollageLcpCandidate } from "./lcp";
import type { SpeciesRecord } from "./types";

function species(
  overrides: Partial<SpeciesRecord> & Pick<SpeciesRecord, "slug" | "sciName">,
): SpeciesRecord {
  return {
    listed: true,
    illustrationStatus: "approved",
    comNameEn: overrides.sciName,
    comNameJa: overrides.sciName,
    comNameZhTw: overrides.sciName,
    perchUrl: "https://example.com/perch.png",
    flightUrl: "https://example.com/flight.png",
    prevalence: {
      winter: 0,
      spring: 0,
      summer: 0,
      autumn: 0,
    },
    ...overrides,
  };
}

describe("pickCollageLcpCandidate", () => {
  it("picks the highest-Prevalence collage bird for the Season", () => {
    const candidate = pickCollageLcpCandidate(
      [
        species({
          slug: "anas-platyrhynchos",
          sciName: "Anas platyrhynchos",
          prevalence: { winter: 50, spring: 10, summer: 0, autumn: 20 },
        }),
        species({
          slug: "passer-montanus",
          sciName: "Passer montanus",
          prevalence: { winter: 80, spring: 70, summer: 60, autumn: 75 },
        }),
      ],
      "winter",
    );
    expect(candidate).toEqual({
      slug: "passer-montanus",
      imageUrl: "https://example.com/perch.png",
    });
  });

  it("breaks Prevalence ties with stable Slug order", () => {
    const candidate = pickCollageLcpCandidate(
      [
        species({
          slug: "zebra-bird",
          sciName: "Zebra bird",
          prevalence: { winter: 70, spring: 0, summer: 0, autumn: 0 },
        }),
        species({
          slug: "alpha-bird",
          sciName: "Alpha bird",
          prevalence: { winter: 70, spring: 0, summer: 0, autumn: 0 },
        }),
      ],
      "winter",
    );
    expect(candidate?.slug).toBe("alpha-bird");
  });

  it("uses the slug-hash pose rule (flight when hash bit set)", () => {
    // hirundo-rustica hash prefers flight
    const candidate = pickCollageLcpCandidate(
      [
        species({
          slug: "hirundo-rustica",
          sciName: "Hirundo rustica",
          prevalence: { winter: 0, spring: 5, summer: 55, autumn: 15 },
        }),
      ],
      "summer",
    );
    expect(candidate).toEqual({
      slug: "hirundo-rustica",
      imageUrl: "https://example.com/flight.png",
    });
  });

  it("returns null when no collage bird qualifies", () => {
    expect(
      pickCollageLcpCandidate(
        [
          species({
            slug: "pending",
            sciName: "Pending",
            illustrationStatus: "pendingReview",
            prevalence: { winter: 90, spring: 90, summer: 90, autumn: 90 },
          }),
        ],
        "winter",
      ),
    ).toBeNull();
  });
});
