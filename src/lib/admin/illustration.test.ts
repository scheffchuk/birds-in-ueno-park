import { describe, expect, it } from "vitest";
import {
  planApproveIllustrations,
  planAttachIllustrations,
  planRejectIllustrations,
  planStartIllustrationRegen,
} from "./illustration";

describe("planAttachIllustrations", () => {
  it("stages both poses as pendingReview with mask and dims", () => {
    expect(
      planAttachIllustrations({
        illustrationPerch: "perch_id",
        illustrationFlight: "flight_id",
        maskPerch: { w: 10, h: 8, bits: "AA==" },
        maskFlight: { w: 12, h: 6, bits: "AQ==" },
        dimsPerch: [560, 400],
        dimsFlight: [560, 280],
      }),
    ).toEqual({
      illustrationPerch: "perch_id",
      illustrationFlight: "flight_id",
      maskPerch: { w: 10, h: 8, bits: "AA==" },
      maskFlight: { w: 12, h: 6, bits: "AQ==" },
      dimsPerch: [560, 400],
      dimsFlight: [560, 280],
      illustrationStatus: "pendingReview",
    });
  });

  it("synthesizes opaque masks from dims when masks are omitted", () => {
    const planned = planAttachIllustrations({
      illustrationPerch: "perch_id",
      illustrationFlight: "flight_id",
      dimsPerch: [8, 1],
      dimsFlight: [8, 1],
    });
    expect(planned.maskPerch).toEqual({ w: 8, h: 1, bits: "/w==" });
    expect(planned.maskFlight).toEqual({ w: 8, h: 1, bits: "/w==" });
    expect(planned.illustrationStatus).toBe("pendingReview");
  });

  it("rejects attach when either pose is missing", () => {
    expect(() =>
      planAttachIllustrations({
        illustrationPerch: "perch_id",
        illustrationFlight: "",
        dimsPerch: [560, 400],
        dimsFlight: [560, 280],
      }),
    ).toThrow(/both poses/i);
  });
});

describe("planApproveIllustrations", () => {
  it("approves only when both cutouts are staged", () => {
    expect(
      planApproveIllustrations({
        illustrationPerch: "p",
        illustrationFlight: "f",
      }),
    ).toEqual({ illustrationStatus: "approved" });
  });

  it("throws when a pose is missing", () => {
    expect(() =>
      planApproveIllustrations({
        illustrationPerch: "p",
        illustrationFlight: undefined,
      }),
    ).toThrow(/both poses/i);
  });
});

describe("planRejectIllustrations", () => {
  it("marks the pair failed", () => {
    expect(planRejectIllustrations()).toEqual({
      illustrationStatus: "failed",
    });
  });
});

describe("planStartIllustrationRegen", () => {
  it("flips status to generating so collage drops the species immediately", () => {
    expect(planStartIllustrationRegen()).toEqual({
      illustrationStatus: "generating",
    });
  });
});
