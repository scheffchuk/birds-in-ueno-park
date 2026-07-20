export type MaskBits = { w: number; h: number; bits: string };

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
