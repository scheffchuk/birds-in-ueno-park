import { mapPool } from "./map-pool";

export const GEMINI_ILLUSTRATION_MODEL = "google/gemini-2.5-flash-image";

/** Concurrent Gemini Flash Image calls. */
const EDIT_CONCURRENCY = 3;

export type IllustrationPose = "perch" | "flight";

export type GenerateIllustrationsInput = {
  limit?: number;
  slugs?: string[];
  poses?: IllustrationPose[];
};

export type PreparedGenerateRequest = {
  customId: string;
  prompt: string;
  images: Array<{ imageUrl: string }>;
  slug: string;
  pose: IllustrationPose;
  sciName: string;
  comNameEn: string;
};

export type GenerateIllustrationsResult = {
  ok: true;
  mode: "gemini";
  model: string;
  requestCount: number;
  started: number;
  failed: number;
  skipped: string[];
  message?: string;
};

export type IllustrationGenerateAdapters = {
  prepare: (input: GenerateIllustrationsInput) => Promise<{
    requests: PreparedGenerateRequest[];
    skipped: string[];
    emptyReason?: string;
  }>;
  edit: (input: {
    prompt: string;
    imageUrls: string[];
  }) => Promise<{ pngBytes: Buffer }>;
  uploadPng: (pngBytes: Buffer) => Promise<string>;
  startWorkflow: (input: {
    customId: string;
    imageUrl: string;
    sciName: string;
    comNameEn: string;
  }) => Promise<void>;
  failPose: (input: { slug: string; reason: string }) => Promise<void>;
};

export type RejectAndRegenerateInput = {
  speciesId: string;
  pose?: IllustrationPose;
};

export type IllustrationRejectRegenAdapters = IllustrationGenerateAdapters & {
  reject: (input: RejectAndRegenerateInput) => Promise<{
    slug: string;
    poses: IllustrationPose[];
  }>;
};

/**
 * Admin-triggered sync Gemini generate for missing / selected / single-pose slices.
 * Callers get started/failed/skipped; Gemini + storage are substitutable adapters.
 */
export async function generateIllustrations(
  input: GenerateIllustrationsInput,
  adapters: IllustrationGenerateAdapters,
): Promise<GenerateIllustrationsResult> {
  const prepared = await adapters.prepare(input);
  const requests = prepared.requests;

  if (requests.length === 0) {
    return {
      ok: true,
      mode: "gemini",
      model: GEMINI_ILLUSTRATION_MODEL,
      requestCount: 0,
      started: 0,
      failed: 0,
      skipped: prepared.skipped,
      message:
        prepared.emptyReason ?? "No species selected for generation",
    };
  }

  let started = 0;
  let failed = 0;

  await mapPool(requests, EDIT_CONCURRENCY, async (r) => {
    try {
      const { pngBytes } = await adapters.edit({
        prompt: r.prompt,
        imageUrls: r.images.map((img) => img.imageUrl),
      });
      const imageUrl = await adapters.uploadPng(pngBytes);
      await adapters.startWorkflow({
        customId: r.customId,
        imageUrl,
        sciName: r.sciName,
        comNameEn: r.comNameEn,
      });
      started += 1;
    } catch (err) {
      failed += 1;
      const reason =
        err instanceof Error ? err.message : "Gemini image edit failed";
      console.error("Illustration Gemini edit failed", {
        customId: r.customId,
        reason,
      });
      await adapters.failPose({ slug: r.slug, reason });
    }
  });

  return {
    ok: true,
    mode: "gemini",
    model: GEMINI_ILLUSTRATION_MODEL,
    requestCount: requests.length,
    started,
    failed,
    skipped: prepared.skipped,
  };
}

/**
 * Flip Illustration status / clear art, then regenerate through the same
 * generate path (pair or single pose). Regen cannot drift from generate.
 */
export async function rejectAndRegenerateIllustrations(
  input: RejectAndRegenerateInput,
  adapters: IllustrationRejectRegenAdapters,
): Promise<GenerateIllustrationsResult> {
  const { slug, poses } = await adapters.reject(input);
  return generateIllustrations(
    { slugs: [slug], poses, limit: 1 },
    adapters,
  );
}
