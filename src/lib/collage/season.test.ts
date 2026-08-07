import { afterEach, describe, expect, it, vi } from "vitest";
import {
  currentTokyoSeason,
  hrefWithSeason,
  parseSeasonSearchParam,
  readSeasonSearchParam,
  replaceSeasonSearchParam,
} from "./season";

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

describe("readSeasonSearchParam", () => {
  it("returns a valid Season filter as-is", () => {
    expect(readSeasonSearchParam("winter")).toBe("winter");
    expect(readSeasonSearchParam("all")).toBe("all");
  });

  it("returns undefined when missing or invalid", () => {
    expect(readSeasonSearchParam(undefined)).toBeUndefined();
    expect(readSeasonSearchParam("fall")).toBeUndefined();
    expect(readSeasonSearchParam("")).toBeUndefined();
  });

  it("uses the first value when the param is an array", () => {
    expect(readSeasonSearchParam(["autumn", "winter"])).toBe("autumn");
    expect(readSeasonSearchParam(["nope"])).toBeUndefined();
  });
});

describe("parseSeasonSearchParam", () => {
  const midSummerUtc = Date.UTC(2026, 6, 20, 0); // → summer in Tokyo

  it("returns a valid Season filter as-is", () => {
    expect(parseSeasonSearchParam("winter")).toBe("winter");
    expect(parseSeasonSearchParam("spring")).toBe("spring");
    expect(parseSeasonSearchParam("summer")).toBe("summer");
    expect(parseSeasonSearchParam("autumn")).toBe("autumn");
    expect(parseSeasonSearchParam("all")).toBe("all");
  });

  it("falls back to Tokyo meteorological Season when missing", () => {
    expect(parseSeasonSearchParam(undefined, midSummerUtc)).toBe("summer");
  });

  it("falls back to Tokyo meteorological Season when invalid", () => {
    expect(parseSeasonSearchParam("fall", midSummerUtc)).toBe("summer");
    expect(parseSeasonSearchParam("", midSummerUtc)).toBe("summer");
    expect(parseSeasonSearchParam("WINTER", midSummerUtc)).toBe("summer");
  });

  it("uses the first value when the param is an array", () => {
    expect(parseSeasonSearchParam(["autumn", "winter"], midSummerUtc)).toBe(
      "autumn",
    );
    expect(parseSeasonSearchParam(["nope"], midSummerUtc)).toBe("summer");
  });
});

describe("hrefWithSeason", () => {
  it("returns the pathname alone when season is absent", () => {
    expect(hrefWithSeason("/atlas", undefined)).toBe("/atlas");
    expect(hrefWithSeason("/", undefined)).toBe("/");
  });

  it("attaches ?season= when present", () => {
    expect(hrefWithSeason("/atlas", "winter")).toEqual({
      pathname: "/atlas",
      query: { season: "winter" },
    });
  });
});

describe("replaceSeasonSearchParam", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("writes ?season= via history.replaceState without navigation", () => {
    const replaceState = vi.fn();
    vi.stubGlobal("window", {
      location: {
        href: "http://localhost:3000/ja?utm=1",
      },
      history: {
        state: { idx: 0 },
        replaceState,
      },
    });

    replaceSeasonSearchParam("winter");

    expect(replaceState).toHaveBeenCalledOnce();
    expect(replaceState).toHaveBeenCalledWith(
      { idx: 0 },
      "",
      "/ja?utm=1&season=winter",
    );
  });

  it("replaces an existing season param", () => {
    const replaceState = vi.fn();
    vi.stubGlobal("window", {
      location: {
        href: "http://localhost:3000/en?season=summer",
      },
      history: {
        state: null,
        replaceState,
      },
    });

    replaceSeasonSearchParam("autumn");

    expect(replaceState).toHaveBeenCalledWith(null, "", "/en?season=autumn");
  });
});
