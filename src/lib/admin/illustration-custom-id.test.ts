import { describe, expect, it } from "vitest";
import {
  formatIllustrationCustomId,
  parseIllustrationCustomId,
} from "../../../convex/lib/illustrationCustomId";

describe("formatIllustrationCustomId", () => {
  it("joins slug and pose with a colon", () => {
    expect(formatIllustrationCustomId("anas-platyrhynchos", "perch")).toBe(
      "anas-platyrhynchos:perch",
    );
    expect(formatIllustrationCustomId("anas-platyrhynchos", "flight")).toBe(
      "anas-platyrhynchos:flight",
    );
  });
});

describe("parseIllustrationCustomId", () => {
  it("splits slug:pose", () => {
    expect(parseIllustrationCustomId("anas-platyrhynchos:perch")).toEqual({
      slug: "anas-platyrhynchos",
      pose: "perch",
    });
  });

  it("rejects unknown poses and malformed ids", () => {
    expect(() => parseIllustrationCustomId("anas-platyrhynchos:swimming")).toThrow(
      /pose/i,
    );
    expect(() => parseIllustrationCustomId("no-colon")).toThrow(/customId/i);
    expect(() => parseIllustrationCustomId(":perch")).toThrow(/customId/i);
  });
});
