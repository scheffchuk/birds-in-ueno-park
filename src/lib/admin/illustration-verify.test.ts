import { describe, expect, it } from "vitest";
import {
  hasRealAnatomyIssues,
  passesIllustrationVerify,
} from "./illustration-verify";

describe("hasRealAnatomyIssues", () => {
  it("treats none/n/a as clean", () => {
    expect(hasRealAnatomyIssues("")).toBe(false);
    expect(hasRealAnatomyIssues("none")).toBe(false);
    expect(hasRealAnatomyIssues("N/A")).toBe(false);
    expect(hasRealAnatomyIssues("extra wing")).toBe(true);
  });
});

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
    expect(passesIllustrationVerify(ok, "perch")).toBe(true);
  });

  it("accepts issues=none from the model", () => {
    expect(
      passesIllustrationVerify({ ...ok, anatomyIssues: "none" }, "perch"),
    ).toBe(true);
  });

  it("allows one visible wing/leg on perch profile", () => {
    expect(
      passesIllustrationVerify({ ...ok, wingCount: 1, legCount: 1 }, "perch"),
    ).toBe(true);
  });

  it("requires two wings in flight; allows zero legs tucked", () => {
    expect(
      passesIllustrationVerify({ ...ok, wingCount: 2, legCount: 0 }, "flight"),
    ).toBe(true);
    expect(
      passesIllustrationVerify({ ...ok, wingCount: 1, legCount: 0 }, "flight"),
    ).toBe(false);
  });

  it("fails closed on mismatch, perch, or bad anatomy", () => {
    expect(
      passesIllustrationVerify({ ...ok, matchesTarget: false }, "perch"),
    ).toBe(false);
    expect(
      passesIllustrationVerify({ ...ok, hasStickOrPerch: true }, "perch"),
    ).toBe(false);
    expect(passesIllustrationVerify({ ...ok, wingCount: 3 }, "perch")).toBe(
      false,
    );
    expect(
      passesIllustrationVerify({ ...ok, anatomyIssues: "extra wing" }, "perch"),
    ).toBe(false);
  });
});
