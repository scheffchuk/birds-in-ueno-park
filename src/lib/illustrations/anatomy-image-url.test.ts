import { describe, expect, it } from "vitest";
import { boundAnatomyImageUrl } from "../../../convex/lib/anatomyImageUrl";

describe("boundAnatomyImageUrl", () => {
  it("rewrites commons direct file to thumb width", () => {
    const input =
      "https://upload.wikimedia.org/wikipedia/commons/a/ab/Great_egret.jpg";
    expect(boundAnatomyImageUrl(input, 1600)).toBe(
      "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Great_egret.jpg/1600px-Great_egret.jpg",
    );
  });

  it("sets width on Special:FilePath", () => {
    const input =
      "https://commons.wikimedia.org/wiki/Special:FilePath/Foo.jpg";
    expect(boundAnatomyImageUrl(input)).toContain("width=1600");
  });

  it("leaves unrelated hosts alone", () => {
    const input = "https://example.com/bird.jpg";
    expect(boundAnatomyImageUrl(input)).toBe(input);
  });
});
