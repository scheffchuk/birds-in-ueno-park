import { describe, expect, it } from "vitest";
import { currentTokyoSeason } from "./season";

describe("currentTokyoSeason", () => {
  it("maps meteorological months in Asia/Tokyo", () => {
    // 2026-01-15 12:00 UTC = 21:00 JST Jan 15 → winter
    expect(currentTokyoSeason(Date.UTC(2026, 0, 15, 12))).toBe("winter");
    // 2026-04-01 00:00 UTC = 09:00 JST Apr 1 → spring
    expect(currentTokyoSeason(Date.UTC(2026, 3, 1, 0))).toBe("spring");
    // 2026-07-20 00:00 UTC = 09:00 JST Jul 20 → summer
    expect(currentTokyoSeason(Date.UTC(2026, 6, 20, 0))).toBe("summer");
    // 2026-10-01 00:00 UTC = 09:00 JST Oct 1 → autumn
    expect(currentTokyoSeason(Date.UTC(2026, 9, 1, 0))).toBe("autumn");
  });

  it("uses Tokyo date near UTC month boundaries", () => {
    // 2026-02-28 16:00 UTC = 2026-03-01 01:00 JST → spring
    expect(currentTokyoSeason(Date.UTC(2026, 1, 28, 16))).toBe("spring");
  });
});
