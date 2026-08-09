import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getSeasonLocationEpoch,
  hrefWithSeason,
  parseSeasonSearchParam,
  readSeasonSearchParam,
  replaceSeasonSearchParam,
  subscribeSeasonLocation,
} from "./season";

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
  it("returns a valid Season filter as-is", () => {
    expect(parseSeasonSearchParam("winter")).toBe("winter");
    expect(parseSeasonSearchParam("spring")).toBe("spring");
    expect(parseSeasonSearchParam("summer")).toBe("summer");
    expect(parseSeasonSearchParam("autumn")).toBe("autumn");
    expect(parseSeasonSearchParam("all")).toBe("all");
  });

  it("falls back to All when missing or invalid", () => {
    expect(parseSeasonSearchParam(undefined)).toBe("all");
    expect(parseSeasonSearchParam("fall")).toBe("all");
    expect(parseSeasonSearchParam("")).toBe("all");
    expect(parseSeasonSearchParam("WINTER")).toBe("all");
  });

  it("uses the first value when the param is an array", () => {
    expect(parseSeasonSearchParam(["autumn", "winter"])).toBe("autumn");
    expect(parseSeasonSearchParam(["nope"])).toBe("all");
  });
});

describe("hrefWithSeason", () => {
  it("returns the pathname alone when season is absent", () => {
    expect(hrefWithSeason("/atlas", undefined)).toBe("/atlas");
    expect(hrefWithSeason("/", undefined)).toBe("/");
    expect(hrefWithSeason("/atlas/mallard", undefined)).toBe("/atlas/mallard");
  });

  it("attaches ?season= when present", () => {
    expect(hrefWithSeason("/atlas", "winter")).toEqual({
      pathname: "/atlas",
      query: { season: "winter" },
    });
    expect(hrefWithSeason("/atlas/mallard", "summer")).toEqual({
      pathname: "/atlas/mallard",
      query: { season: "summer" },
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
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const before = getSeasonLocationEpoch();
    const listener = vi.fn();
    const unsubscribe = subscribeSeasonLocation(listener);

    replaceSeasonSearchParam("winter");

    expect(replaceState).toHaveBeenCalledOnce();
    expect(replaceState).toHaveBeenCalledWith(
      { idx: 0 },
      "",
      "/ja?utm=1&season=winter",
    );
    expect(getSeasonLocationEpoch()).toBe(before + 1);
    expect(listener).toHaveBeenCalledOnce();
    unsubscribe();
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
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    replaceSeasonSearchParam("autumn");

    expect(replaceState).toHaveBeenCalledWith(null, "", "/en?season=autumn");
  });
});
