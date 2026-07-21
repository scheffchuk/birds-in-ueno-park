import { describe, expect, it } from "vitest";
import {
  batchFailureReason,
  isBatchCompletedSuccess,
  isBatchEffectivelyTerminal,
} from "./batch-terminal";

describe("isBatchEffectivelyTerminal", () => {
  it("treats cancel_time as terminal even when status is in_progress", () => {
    expect(
      isBatchEffectivelyTerminal({
        status: "in_progress",
        raw: {
          cancel_time: "2026-07-20",
          cancel_by_xai_message:
            "Model grok-imagine-image-quality is not supported for batch processing.",
        },
      }),
    ).toBe(true);
  });

  it("keeps live in_progress open", () => {
    expect(
      isBatchEffectivelyTerminal({
        status: "in_progress",
        raw: {},
      }),
    ).toBe(false);
  });

  it("recognizes completed/failed", () => {
    expect(isBatchEffectivelyTerminal({ status: "completed" })).toBe(true);
    expect(isBatchEffectivelyTerminal({ status: "failed" })).toBe(true);
  });
});

describe("isBatchCompletedSuccess", () => {
  it("rejects cancelled batches that still report completed-like fields", () => {
    expect(
      isBatchCompletedSuccess({
        status: "completed",
        raw: { cancel_time: "2026-07-20" },
      }),
    ).toBe(false);
  });

  it("accepts plain completed", () => {
    expect(isBatchCompletedSuccess({ status: "completed" })).toBe(true);
  });
});

describe("batchFailureReason", () => {
  it("prefers xAI cancel message", () => {
    expect(
      batchFailureReason({
        status: "in_progress",
        raw: {
          cancel_time: "2026-07-20",
          cancel_by_xai_message: "Model not supported",
        },
      }),
    ).toBe("Model not supported");
  });
});
