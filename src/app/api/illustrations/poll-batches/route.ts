import {
  api,
  pipelineClient,
  pipelineSecret,
} from "@/lib/illustrations/pipeline-client";
import { deliverIllustrationBatch } from "@/lib/illustrations/deliver-batch";

export const runtime = "nodejs";
export const maxDuration = 300;

type Body = { token: string };

/**
 * Admin-authenticated poll of open Batchwork jobs (same work as the cron route).
 */
export async function POST(request: Request) {
  const body = (await request.json()) as Body;
  if (!body.token) {
    return Response.json({ error: "token required" }, { status: 401 });
  }

  const authed = pipelineClient();
  authed.setAuth(body.token);
  const isAdmin = await authed.query(api.admin.viewerIsAdmin, {});
  if (!isAdmin) {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
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
