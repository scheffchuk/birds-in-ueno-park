import { batch } from "batchwork";
import {
  api,
  pipelineClient,
  pipelineSecret,
} from "@/lib/illustrations/pipeline-client";
import { deliverIllustrationBatch } from "@/lib/illustrations/deliver-batch";

export const runtime = "nodejs";
export const maxDuration = 300;

type Body = {
  limit?: number;
  slugs?: string[];
  /** Convex Auth JWT from the admin session. */
  token: string;
};

/**
 * Admin-triggered Batchwork submit for missing poses (default limit 20).
 * Poll `/api/cron/illustration-batches` (or Vercel Cron) to start pose workflows.
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

  if (!process.env.XAI_API_KEY) {
    return Response.json(
      { error: "XAI_API_KEY required for Batchwork xAI image edit" },
      { status: 500 },
    );
  }

  const prepared = await client.mutation(
    api.illustrationPipeline.prepareIllustrationBatch,
    {
      limit: body.limit ?? 20,
      slugs: body.slugs,
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
      batchId: null,
      requestCount: 0,
      skipped: prepared.skipped,
      message: "No species selected for generation",
    });
  }

  const job = await batch.images.edit({
    model: "xai/grok-imagine-image-quality",
    requests: requests.map((r: PreparedRequest) => ({
      customId: r.customId,
      prompt: r.prompt,
      images: r.images,
    })),
  });

  const secret = pipelineSecret();
  const requestsMeta = requests.map((r: PreparedRequest) => ({
    customId: r.customId,
    slug: r.slug,
    pose: r.pose,
    sciName: r.sciName,
    comNameEn: r.comNameEn,
  }));

  const batchDocId = await client.mutation(
    api.illustrationPipeline.recordIllustrationBatch,
    {
      secret,
      provider: job.provider,
      batchId: job.id,
      requests: requestsMeta,
    },
  );

  try {
    await deliverIllustrationBatch({
      _id: batchDocId,
      provider: job.provider,
      batchId: job.id,
      requests: requestsMeta,
    });
  } catch (err) {
    console.error("Immediate batch deliver deferred to cron", err);
  }

  return Response.json({
    ok: true,
    batchId: job.id,
    provider: job.provider,
    requestCount: requests.length,
    skipped: prepared.skipped,
  });
}
