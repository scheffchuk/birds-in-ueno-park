import { describe, expect, it } from "vitest";
import { isGitHubIdAllowlisted, parseGitHubAllowlist } from "./allowlist";

describe("parseGitHubAllowlist", () => {
  it("splits comma-separated ids and trims whitespace", () => {
    expect(parseGitHubAllowlist(" 123 , 456,789 ")).toEqual([
      "123",
      "456",
      "789",
    ]);
  });

  it("drops empty segments", () => {
    expect(parseGitHubAllowlist(",,42,,")).toEqual(["42"]);
  });
});

describe("isGitHubIdAllowlisted", () => {
  it("allows when github id is in the list", () => {
    expect(isGitHubIdAllowlisted("42", "1,42,99")).toBe(true);
  });

  it("denies when github id is missing or list empty", () => {
    expect(isGitHubIdAllowlisted("42", "1,99")).toBe(false);
    expect(isGitHubIdAllowlisted("42", "")).toBe(false);
    expect(isGitHubIdAllowlisted("", "42")).toBe(false);
  });
});
