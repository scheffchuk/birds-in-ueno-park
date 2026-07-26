import { describe, expect, it } from "vitest";
import {
  planFailIllustrationPose,
  planStageIllustrationPose,
} from "../../../convex/lib/illustration";

describe("planStageIllustrationPose", () => {
  it("keeps generating when only one pose is staged", () => {
    expect(
      planStageIllustrationPose({
        pose: "perch",
        storageId: "perch_id",
        mask: { w: 8, h: 1, bits: "/w==" },
        dims: [560, 400],
        existing: {},
      }),
    ).toEqual({
      illustrationPerch: "perch_id",
      maskPerch: { w: 8, h: 1, bits: "/w==" },
      dimsPerch: [560, 400],
      illustrationStatus: "generating",
    });
  });

  it("reaches pendingReview only when both poses are present", () => {
    expect(
      planStageIllustrationPose({
        pose: "flight",
        storageId: "flight_id",
        mask: { w: 8, h: 1, bits: "/w==" },
        dims: [560, 280],
        existing: {
          illustrationPerch: "perch_id",
          maskPerch: { w: 8, h: 1, bits: "/w==" },
          dimsPerch: [560, 400],
        },
      }),
    ).toEqual({
      illustrationFlight: "flight_id",
      maskFlight: { w: 8, h: 1, bits: "/w==" },
      dimsFlight: [560, 280],
      illustrationStatus: "pendingReview",
    });
  });
});

describe("planFailIllustrationPose", () => {
  it("fails the species closed after a pose failure", () => {
    expect(planFailIllustrationPose()).toEqual({
      illustrationStatus: "failed",
    });
  });
});
