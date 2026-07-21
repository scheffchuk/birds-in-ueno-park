import { describe, expect, it } from "vitest";
import {
  flightSearchQueries,
  inatLargePhotoUrl,
  pickBestFlightHit,
  scoreFlightHit,
  scoreFlightText,
} from "../../../convex/lib/anatomyFlightRef";

describe("inatLargePhotoUrl", () => {
  it("upgrades square to large", () => {
    expect(
      inatLargePhotoUrl(
        "https://inaturalist-open-data.s3.amazonaws.com/photos/1/square.jpg",
      ),
    ).toBe(
      "https://inaturalist-open-data.s3.amazonaws.com/photos/1/large.jpg",
    );
  });
});

describe("scoreFlightText", () => {
  it("prefers in-flight titles", () => {
    expect(
      scoreFlightText("File:Mallard (Anas platyrhynchos) male in flight.jpg"),
    ).toBeGreaterThan(scoreFlightText("File:Anas platyrhynchos pond.jpg"));
  });

  it("penalizes maps", () => {
    expect(scoreFlightText("File:Mallard range map.png")).toBeLessThan(0);
  });
});

describe("scoreFlightHit", () => {
  it("accepts flight only in description/categories", () => {
    const score = scoreFlightHit({
      title: "File:Accipiter nisus 1 (Martin Mecnarowski).jpg",
      url: "https://example.com/a.jpg",
      description: "Eurasian Sparrowhawk in flight over woodland",
      categories: "Accipiter nisus|Birds in flight",
    });
    expect(score).toBeGreaterThanOrEqual(20);
  });
});

describe("pickBestFlightHit", () => {
  it("picks in-flight over non-flight", () => {
    const best = pickBestFlightHit([
      {
        title: "File:Anas platyrhynchos lake.jpg",
        url: "https://example.com/a.jpg",
      },
      {
        title: "File:Mallard male in flight Marken.jpg",
        url: "https://example.com/b.jpg",
      },
    ]);
    expect(best?.url).toBe("https://example.com/b.jpg");
  });

  it("returns null when nothing looks like flight", () => {
    expect(
      pickBestFlightHit([
        { title: "File:Duck pond.jpg", url: "https://example.com/a.jpg" },
      ]),
    ).toBeNull();
  });
});

describe("flightSearchQueries", () => {
  it("keeps Commons query list short", () => {
    const qs = flightSearchQueries({
      sciName: "Accipiter nisus",
      comNameEn: "Eurasian Sparrowhawk",
    });
    expect(qs.length).toBeLessThanOrEqual(4);
    expect(qs.some((q) => q.includes("Accipiter nisus"))).toBe(true);
  });
});
