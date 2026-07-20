import {
  api,
  pipelineClient,
  pipelineSecret,
} from "@/lib/illustrations/pipeline-client";
import { deliverIllustrationBatch } from "@/lib/illustrations/deliver-batch";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Vercel Cron / manual tick: poll open Batchwork jobs and start pose workflows.
 * Auth: Authorization: Bearer $CRON_SECRET (or x-pipeline-secret).
 */
export async function GET(request: Request) {
  const auth =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    request.headers.get("x-pipeline-secret");
  const cronSecret = process.env.CRON_SECRET;
  const pipeline = process.env.ILLUSTRATION_PIPELINE_SECRET;
  if (!auth || (auth !== cronSecret && auth !== pipeline)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = pipelineClient();
  const secret = pipelineSecret();
  const open = await client.query(
    api.illustrationPipeline.listOpenIllustrationBatches,
    { secret },
  );

  const results = [];
  for (const job of open) {
    const status = await deliverIllustrationBatch(job);
    results.push({ batchId: job.batchId, status });
  }

  return Response.json({ ok: true, processed: results.length, results });
}
