import { getBatch, getBatchResults, isTerminalStatus } from "batchwork";
import type { BatchProvider } from "batchwork";
import { start } from "workflow/api";
import { processIllustrationPose } from "../../../workflows/generate-illustration-pose";
import {
  api,
  pipelineClient,
  pipelineSecret,
} from "@/lib/illustrations/pipeline-client";

/** Poll one open Batchwork job; on completion start per-pose workflows. */
export async function deliverIllustrationBatch(job: {
  _id: string;
  provider: string;
  batchId: string;
  requests: Array<{
    customId: string;
    slug: string;
    pose: "perch" | "flight";
    sciName: string;
    comNameEn: string;
  }>;
}): Promise<"open" | "delivered" | "failed"> {
  const batch = await getBatch({
    provider: job.provider as BatchProvider,
    id: job.batchId,
  });
  const snapshot = await batch.poll();
  if (!isTerminalStatus(snapshot.status)) {
    return "open";
  }

  const client = pipelineClient();
  const secret = pipelineSecret();
  const byCustomId = new Map(job.requests.map((r) => [r.customId, r]));

  if (snapshot.status !== "completed") {
    for (const req of job.requests) {
      await client.mutation(api.illustrationPipeline.failIllustrationPose, {
        secret,
        slug: req.slug,
        reason: `batch ${snapshot.status}`,
      });
    }
    await client.mutation(
      api.illustrationPipeline.markIllustrationBatchDelivered,
      {
        secret,
        batchDocId: job._id as never,
        status: "failed",
      },
    );
    return "failed";
  }

  for await (const result of getBatchResults({
    provider: job.provider as BatchProvider,
    id: job.batchId,
  })) {
    const meta = result.customId
      ? byCustomId.get(result.customId)
      : undefined;
    if (!meta) continue;

    if (result.status !== "succeeded") {
      await client.mutation(api.illustrationPipeline.failIllustrationPose, {
        secret,
        slug: meta.slug,
        reason: result.error?.message ?? "batch request errored",
      });
      continue;
    }

    const imageUrl = result.images?.[0]?.url;
    if (!imageUrl) {
      await client.mutation(api.illustrationPipeline.failIllustrationPose, {
        secret,
        slug: meta.slug,
        reason: "batch result missing image URL",
      });
      continue;
    }

    await start(processIllustrationPose, [
      {
        customId: meta.customId,
        imageUrl,
        sciName: meta.sciName,
        comNameEn: meta.comNameEn,
      },
    ]);
  }

  await client.mutation(
    api.illustrationPipeline.markIllustrationBatchDelivered,
    {
      secret,
      batchDocId: job._id as never,
      status: "delivered",
    },
  );
  return "delivered";
}
