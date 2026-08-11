import { describe, expect, it } from "vitest";
import { seasonAt } from "./calendar";

/** Fixed UTC instants that land in known Asia/Tokyo calendar months. */
const TOKYO = "Asia/Tokyo";

describe("seasonAt", () => {
  it("maps meteorological Winter months in Asia/Tokyo", () => {
    // 2024-12-15 12:00 JST = 2024-12-15 03:00 UTC
    expect(seasonAt(Date.UTC(2024, 11, 15, 3), TOKYO)).toBe("winter");
    // 2025-01-15 12:00 JST
    expect(seasonAt(Date.UTC(2025, 0, 15, 3), TOKYO)).toBe("winter");
    // 2025-02-15 12:00 JST
    expect(seasonAt(Date.UTC(2025, 1, 15, 3), TOKYO)).toBe("winter");
  });

  it("maps Spring, Summer, Autumn in Asia/Tokyo", () => {
    expect(seasonAt(Date.UTC(2025, 2, 15, 3), TOKYO)).toBe("spring");
    expect(seasonAt(Date.UTC(2025, 5, 15, 3), TOKYO)).toBe("summer");
    expect(seasonAt(Date.UTC(2025, 8, 15, 3), TOKYO)).toBe("autumn");
  });

  it("uses Asia/Tokyo across the UTC date line", () => {
    // 2025-02-28 15:00 UTC = 2025-03-01 00:00 JST → Spring, not Winter
    expect(seasonAt(Date.UTC(2025, 1, 28, 15), TOKYO)).toBe("spring");
  });

  it("defaults the time zone to Asia/Tokyo", () => {
    expect(seasonAt(Date.UTC(2025, 6, 1, 3))).toBe("summer");
  });
});
