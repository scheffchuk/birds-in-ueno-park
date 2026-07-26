import { start } from "workflow/api";
import { processIllustrationPose } from "../../../../../workflows/generate-illustration-pose";
import {
  api,
  pipelineClient,
  pipelineSecret,
} from "@/lib/illustrations/pipeline-client";
import { geminiImageEdit } from "@/lib/illustrations/gemini-image-edit";
import { mapPool } from "@/lib/illustrations/map-pool";
import type { Id } from "../../../../../convex/_generated/dataModel";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Concurrent Gemini Flash Image calls. */
const EDIT_CONCURRENCY = 3;

type Body = {
  limit?: number;
  slugs?: string[];
  /** Limit generation to these poses (default both). */
  poses?: Array<"perch" | "flight">;
  /** Convex Auth JWT from the admin session. */
  token: string;
};

/**
 * Admin-triggered Gemini Flash Image generates for missing poses (default 20).
 * Uses AI Gateway `google/gemini-2.5-flash-image` (same family as AvianVisitors).
 * Starts a per-pose Workflow as each image returns.
 */
export async function POST(request: Request) {
  const body = (await request.json()) as Body;
  if (!body.token) {
    return Response.json({ error: "token required" }, { status: 401 });
  }

  const client = pipelineClient();
  client.setAuth(body.token);

  const isAdmin = await client.query(api.admin.viewerIsAdmin, {});
  if (!isAdmin) {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (!process.env.AI_GATEWAY_API_KEY) {
    return Response.json(
      { error: "AI_GATEWAY_API_KEY required for Gemini image edit" },
      { status: 500 },
    );
  }

  const prepared = await client.mutation(
    api.illustrationPipeline.prepareIllustrationGenerate,
    {
      limit: body.limit ?? 20,
      slugs: body.slugs,
      poses: body.poses,
    },
  );

  type PreparedRequest = {
    customId: string;
    prompt: string;
    images: Array<{ imageUrl: string }>;
    slug: string;
    pose: "perch" | "flight";
    sciName: string;
    comNameEn: string;
  };
  const requests = prepared.requests as PreparedRequest[];

  if (requests.length === 0) {
    return Response.json({
      ok: true,
      requestCount: 0,
      started: 0,
      failed: 0,
      skipped: prepared.skipped,
      message:
        (prepared as { emptyReason?: string }).emptyReason ??
        "No species selected for generation",
    });
  }

  const secret = pipelineSecret();
  let started = 0;
  let failed = 0;

  await mapPool(requests, EDIT_CONCURRENCY, async (r) => {
    try {
      const { pngBytes } = await geminiImageEdit({
        prompt: r.prompt,
        imageUrls: r.images.map((img) => img.imageUrl),
      });

      const imageUrl = await uploadPipelinePng(client, secret, pngBytes);

      await start(processIllustrationPose, [
        {
          customId: r.customId,
          imageUrl,
          sciName: r.sciName,
          comNameEn: r.comNameEn,
        },
      ]);
      started += 1;
    } catch (err) {
      failed += 1;
      const reason =
        err instanceof Error ? err.message : "Gemini image edit failed";
      console.error("Illustration Gemini edit failed", {
        customId: r.customId,
        reason,
      });
      await client.mutation(api.illustrationPipeline.failIllustrationPose, {
        secret,
        slug: r.slug,
        reason,
      });
    }
  });

  return Response.json({
    ok: true,
    mode: "gemini",
    model: "google/gemini-2.5-flash-image",
    requestCount: requests.length,
    started,
    failed,
    skipped: prepared.skipped,
  });
}

async function uploadPipelinePng(
  client: ReturnType<typeof pipelineClient>,
  secret: string,
  pngBytes: Buffer,
): Promise<string> {
  const uploadUrl = await client.mutation(
    api.illustrationPipeline.generatePipelineUploadUrl,
    { secret },
  );
  const uploadRes = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": "image/png" },
    body: new Uint8Array(pngBytes),
  });
  if (!uploadRes.ok) {
    throw new Error(`Convex upload failed: ${uploadRes.status}`);
  }
  const { storageId } = (await uploadRes.json()) as { storageId: string };
  const url = await client.mutation(
    api.illustrationPipeline.getPipelineStorageUrl,
    { secret, storageId: storageId as Id<"_storage"> },
  );
  if (!url) throw new Error("Convex storage URL missing after upload");
  return url;
}
