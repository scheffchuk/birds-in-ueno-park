/**
 * Batchwork's isTerminalStatus misses xAI cancel_time while status stays
 * in_progress (e.g. model not supported for batch).
 */
export type BatchSnapshotLike = {
  status: string;
  raw?: unknown;
};

function cancelMeta(raw: unknown): {
  cancelTime?: string;
  cancelMessage?: string;
} {
  if (typeof raw !== "object" || raw === null) return {};
  const cancelTime =
    "cancel_time" in raw && typeof raw.cancel_time === "string"
      ? raw.cancel_time
      : undefined;
  const cancelMessage =
    "cancel_by_xai_message" in raw &&
    typeof raw.cancel_by_xai_message === "string"
      ? raw.cancel_by_xai_message
      : undefined;
  return { cancelTime, cancelMessage };
}

export function isBatchEffectivelyTerminal(
  snapshot: BatchSnapshotLike,
): boolean {
  if (cancelMeta(snapshot.raw).cancelTime) return true;
  return (
    snapshot.status === "completed" ||
    snapshot.status === "failed" ||
    snapshot.status === "canceled" ||
    snapshot.status === "cancelled" ||
    snapshot.status === "expired"
  );
}

export function batchFailureReason(snapshot: BatchSnapshotLike): string {
  const { cancelTime, cancelMessage } = cancelMeta(snapshot.raw);
  if (cancelMessage) return cancelMessage;
  if (cancelTime) return "batch cancelled by provider";
  return `batch ${snapshot.status}`;
}

export function isBatchCompletedSuccess(snapshot: BatchSnapshotLike): boolean {
  return (
    snapshot.status === "completed" && !cancelMeta(snapshot.raw).cancelTime
  );
}
