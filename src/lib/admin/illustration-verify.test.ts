import { describe, expect, it } from "vitest";
import { passesIllustrationVerify } from "./illustration-verify";

describe("passesIllustrationVerify", () => {
  const ok = {
    matchesTarget: true,
    wingCount: 2,
    legCount: 2,
    headCount: 1,
    tailCount: 1,
    hasStickOrPerch: false,
    anatomyIssues: "",
  };

  it("passes a clean verify", () => {
    expect(passesIllustrationVerify(ok)).toBe(true);
  });

  it("fails closed on mismatch, perch, or bad anatomy counts", () => {
    expect(
      passesIllustrationVerify({ ...ok, matchesTarget: false }),
    ).toBe(false);
    expect(
      passesIllustrationVerify({ ...ok, hasStickOrPerch: true }),
    ).toBe(false);
    expect(passesIllustrationVerify({ ...ok, wingCount: 3 })).toBe(false);
    expect(
      passesIllustrationVerify({ ...ok, anatomyIssues: "extra wing" }),
    ).toBe(false);
  });
});
