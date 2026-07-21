import { describe, expect, it } from "vitest";
import { buildIllustrationPrompt } from "./illustration-prompt";

describe("buildIllustrationPrompt", () => {
  it("fills sci/com/pose and points at anatomy IMAGE 1 + style IMAGE 2", () => {
    const prompt = buildIllustrationPrompt({
      sciName: "Anas platyrhynchos",
      comNameEn: "Mallard",
      pose: "perch",
    });
    expect(prompt).toContain("Anas platyrhynchos");
    expect(prompt).toContain("Mallard");
    expect(prompt).toMatch(/perched/i);
    expect(prompt).toContain("IMAGE 1");
    expect(prompt).toContain("IMAGE 2");
    expect(prompt).toMatch(/cream/i);
    expect(prompt).not.toContain("{sci_name}");
    expect(prompt).not.toContain("{anti_ref_line}");
  });

  it("uses in-flight wording for the flight pose", () => {
    const prompt = buildIllustrationPrompt({
      sciName: "Anas platyrhynchos",
      comNameEn: "Mallard",
      pose: "flight",
      anatomyPose: "flight",
    });
    expect(prompt).toMatch(/in flight with wings spread/i);
    expect(prompt).toMatch(/IMAGE 1 shows this species IN FLIGHT/i);
  });
});
