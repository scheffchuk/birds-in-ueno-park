import type { Doc } from "../_generated/dataModel";
import type { IllustrationPose } from "./illustrationCustomId";

export type { IllustrationPose };
export type MaskBits = NonNullable<Doc<"species">["maskPerch"]>;

export type AttachIllustrationsInput = {
  illustrationPerch: string;
  illustrationFlight: string;
  maskPerch?: MaskBits;
  maskFlight?: MaskBits;
  dimsPerch?: number[];
  dimsFlight?: number[];
};

export type AttachIllustrationsPlan = {
  illustrationPerch: string;
  illustrationFlight: string;
  maskPerch?: MaskBits;
  maskFlight?: MaskBits;
  dimsPerch?: number[];
  dimsFlight?: number[];
  illustrationStatus: "pendingReview";
};

/** 1-bit filled silhouette from dims (placeholder until workflow matting). */
export function opaqueMaskFromDims(dims: number[]): MaskBits {
  const w = Math.max(1, Math.round(dims[0] ?? 1));
  const h = Math.max(1, Math.round(dims[1] ?? 1));
  const bytes = new Uint8Array(Math.ceil((w * h) / 8)).fill(0xff);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return { w, h, bits: btoa(binary) };
}

/** Stage perched + flight cutouts together → pendingReview. */
export function planAttachIllustrations(
  input: AttachIllustrationsInput,
): AttachIllustrationsPlan {
  if (!input.illustrationPerch || !input.illustrationFlight) {
    throw new Error("Both poses are required to attach illustrations");
  }
  const dimsPerch = input.dimsPerch;
  const dimsFlight = input.dimsFlight;
  return {
    illustrationPerch: input.illustrationPerch,
    illustrationFlight: input.illustrationFlight,
    maskPerch:
      input.maskPerch ??
      (dimsPerch ? opaqueMaskFromDims(dimsPerch) : undefined),
    maskFlight:
      input.maskFlight ??
      (dimsFlight ? opaqueMaskFromDims(dimsFlight) : undefined),
    dimsPerch,
    dimsFlight,
    illustrationStatus: "pendingReview",
  };
}

/** Approve the perched+flight pair as one. */
export function planApproveIllustrations(existing: {
  illustrationPerch?: string;
  illustrationFlight?: string;
}): { illustrationStatus: "approved" } {
  if (!existing.illustrationPerch || !existing.illustrationFlight) {
    throw new Error("Both poses are required to approve illustrations");
  }
  return { illustrationStatus: "approved" };
}

/** Reject the pair as one. */
export function planRejectIllustrations(): {
  illustrationStatus: "failed";
} {
  return { illustrationStatus: "failed" };
}

/**
 * Start regen: generating immediately so collage omits the species
 * until re-approval (art files may remain staged).
 */
export function planStartIllustrationRegen(): {
  illustrationStatus: "generating";
} {
  return { illustrationStatus: "generating" };
}

export type StagedPoseFields = {
  illustrationPerch?: string;
  illustrationFlight?: string;
  maskPerch?: MaskBits;
  maskFlight?: MaskBits;
  dimsPerch?: number[];
  dimsFlight?: number[];
};

/**
 * Stage one verified pose. pendingReview only when both poses are present.
 */
export function planStageIllustrationPose(input: {
  pose: IllustrationPose;
  storageId: string;
  mask: MaskBits;
  dims: number[];
  existing: StagedPoseFields;
}): StagedPoseFields & {
  illustrationStatus: "generating" | "pendingReview";
} {
  const next: StagedPoseFields = { ...input.existing };
  if (input.pose === "perch") {
    next.illustrationPerch = input.storageId;
    next.maskPerch = input.mask;
    next.dimsPerch = input.dims;
  } else {
    next.illustrationFlight = input.storageId;
    next.maskFlight = input.mask;
    next.dimsFlight = input.dims;
  }

  const both =
    Boolean(next.illustrationPerch) && Boolean(next.illustrationFlight);

  if (input.pose === "perch") {
    return {
      illustrationPerch: next.illustrationPerch,
      maskPerch: next.maskPerch,
      dimsPerch: next.dimsPerch,
      illustrationStatus: both ? "pendingReview" : "generating",
    };
  }
  return {
    illustrationFlight: next.illustrationFlight,
    maskFlight: next.maskFlight,
    dimsFlight: next.dimsFlight,
    illustrationStatus: both ? "pendingReview" : "generating",
  };
}

/** Fail closed when a pose fails verify after retry. */
export function planFailIllustrationPose(): {
  illustrationStatus: "failed";
} {
  return { illustrationStatus: "failed" };
}

/** Patch that clears selected art fields (undefined = delete) and enters generating. */
export type ClearForGenerationPlan = {
  illustrationStatus: "generating";
  illustrationPerch?: undefined;
  illustrationFlight?: undefined;
  maskPerch?: undefined;
  maskFlight?: undefined;
  dimsPerch?: undefined;
  dimsFlight?: undefined;
};

/**
 * Clear cutouts/masks/dims and enter generating before a generate job.
 * Omit pose to clear both; pass a pose to clear only that cutout.
 */
export function planClearForGeneration(
  pose?: IllustrationPose,
): ClearForGenerationPlan {
  if (!pose) {
    return {
      illustrationStatus: "generating",
      illustrationPerch: undefined,
      illustrationFlight: undefined,
      maskPerch: undefined,
      maskFlight: undefined,
      dimsPerch: undefined,
      dimsFlight: undefined,
    };
  }
  if (pose === "perch") {
    return {
      illustrationStatus: "generating",
      illustrationPerch: undefined,
      maskPerch: undefined,
      dimsPerch: undefined,
    };
  }
  return {
    illustrationStatus: "generating",
    illustrationFlight: undefined,
    maskFlight: undefined,
    dimsFlight: undefined,
  };
}

/**
 * Park incomplete pairs as queued for later manual attach (no auto-regen).
 * Leaves complete pairs and already-queued incompletes unchanged.
 */
export function planDeferIncompleteIllustrations(input: {
  illustrationStatus: Doc<"species">["illustrationStatus"];
  illustrationPerch?: string;
  illustrationFlight?: string;
}): { illustrationStatus: "queued" } | null {
  const complete = Boolean(
    input.illustrationPerch && input.illustrationFlight,
  );
  if (complete) return null;
  if (input.illustrationStatus === "queued") return null;
  return { illustrationStatus: "queued" };
}
