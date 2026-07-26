import { describe, expect, it } from "vitest";
import {
  planApproveIllustrations,
  planAttachIllustrations,
  planClearForGeneration,
  planDeferIncompleteIllustrations,
  planRejectIllustrations,
  planStartIllustrationRegen,
} from "../../../convex/lib/illustration";

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

describe("planClearForGeneration", () => {
  it("clears both poses when pose omitted", () => {
    expect(planClearForGeneration()).toEqual({
      illustrationStatus: "generating",
      illustrationPerch: undefined,
      illustrationFlight: undefined,
      maskPerch: undefined,
      maskFlight: undefined,
      dimsPerch: undefined,
      dimsFlight: undefined,
    });
  });

  it("clears only perch when pose is perch", () => {
    expect(planClearForGeneration("perch")).toEqual({
      illustrationStatus: "generating",
      illustrationPerch: undefined,
      maskPerch: undefined,
      dimsPerch: undefined,
    });
  });

  it("clears only flight when pose is flight", () => {
    expect(planClearForGeneration("flight")).toEqual({
      illustrationStatus: "generating",
      illustrationFlight: undefined,
      maskFlight: undefined,
      dimsFlight: undefined,
    });
  });
});

describe("planDeferIncompleteIllustrations", () => {
  it("queues failed/generating species missing a pose for later manual attach", () => {
    expect(
      planDeferIncompleteIllustrations({
        illustrationStatus: "failed",
        illustrationPerch: "p",
        illustrationFlight: undefined,
      }),
    ).toEqual({ illustrationStatus: "queued" });
    expect(
      planDeferIncompleteIllustrations({
        illustrationStatus: "generating",
        illustrationPerch: undefined,
        illustrationFlight: undefined,
      }),
    ).toEqual({ illustrationStatus: "queued" });
  });

  it("leaves complete pairs and already-queued incompletes alone", () => {
    expect(
      planDeferIncompleteIllustrations({
        illustrationStatus: "approved",
        illustrationPerch: "p",
        illustrationFlight: "f",
      }),
    ).toBeNull();
    expect(
      planDeferIncompleteIllustrations({
        illustrationStatus: "pendingReview",
        illustrationPerch: "p",
        illustrationFlight: "f",
      }),
    ).toBeNull();
    expect(
      planDeferIncompleteIllustrations({
        illustrationStatus: "queued",
        illustrationPerch: undefined,
        illustrationFlight: undefined,
      }),
    ).toBeNull();
  });
});
