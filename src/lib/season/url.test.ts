import { describe, expect, it } from "vitest";
import {
  hrefWithSeason,
  readSeasonSearchParam,
  resolveSeasonFilter,
} from "./url";

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

describe("resolveSeasonFilter", () => {
  const now = Date.UTC(2025, 6, 15, 3); // mid-July → Summer in Tokyo

  it("returns a valid Season filter as-is", () => {
    expect(resolveSeasonFilter("winter", now)).toBe("winter");
    expect(resolveSeasonFilter("all", now)).toBe("all");
  });

  it("falls back to the current Season when missing or invalid", () => {
    expect(resolveSeasonFilter(undefined, now)).toBe("summer");
    expect(resolveSeasonFilter("fall", now)).toBe("summer");
    expect(resolveSeasonFilter("", now)).toBe("summer");
    expect(resolveSeasonFilter("WINTER", now)).toBe("summer");
    expect(resolveSeasonFilter(["nope"], now)).toBe("summer");
  });

  it("uses the first value when the param is an array", () => {
    expect(resolveSeasonFilter(["autumn", "winter"], now)).toBe("autumn");
  });
});

describe("hrefWithSeason", () => {
  it("returns the pathname alone when season is absent", () => {
    expect(hrefWithSeason("/atlas", undefined)).toBe("/atlas");
    expect(hrefWithSeason("/", undefined)).toBe("/");
    expect(hrefWithSeason("/atlas/mallard", undefined)).toBe("/atlas/mallard");
  });

  it("attaches ?season= when present, including all", () => {
    expect(hrefWithSeason("/atlas", "winter")).toEqual({
      pathname: "/atlas",
      query: { season: "winter" },
    });
    expect(hrefWithSeason("/atlas", "all")).toEqual({
      pathname: "/atlas",
      query: { season: "all" },
    });
    expect(hrefWithSeason("/atlas/mallard", "summer")).toEqual({
      pathname: "/atlas/mallard",
      query: { season: "summer" },
    });
  });
});
