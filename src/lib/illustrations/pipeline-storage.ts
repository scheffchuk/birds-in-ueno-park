import type { ConvexHttpClient } from "convex/browser";
import type { Id } from "../../../convex/_generated/dataModel";
import type { IllustrationPose } from "../../../convex/lib/illustrationCustomId";
import { api } from "./pipeline-client";

export type PipelineStorageClient = Pick<ConvexHttpClient, "mutation">;

export type StagePoseInput = {
  slug: string;
  pose: IllustrationPose;
  pngBytes: Buffer;
  mask: { w: number; h: number; bits: string };
  dims: number[];
};

export function createPipelineStorage(deps: {
  client: PipelineStorageClient;
  secret: string;
}) {
  const { client, secret } = deps;

  async function uploadPng(pngBytes: Buffer): Promise<Id<"_storage">> {
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
    const uploaded: unknown = await uploadRes.json();
    if (
      typeof uploaded !== "object" ||
      uploaded === null ||
      !("storageId" in uploaded) ||
      typeof uploaded.storageId !== "string"
    ) {
      throw new Error("Convex upload missing storageId");
    }
    return uploaded.storageId as Id<"_storage">;
  }

  return {
    async uploadPngForUrl(pngBytes: Buffer): Promise<string> {
      const storageId = await uploadPng(pngBytes);
      const url = await client.mutation(
        api.illustrationPipeline.getPipelineStorageUrl,
        { secret, storageId },
      );
      if (!url) throw new Error("Convex storage URL missing after upload");
      return url;
    },

    async stagePose(input: StagePoseInput): Promise<void> {
      const storageId = await uploadPng(input.pngBytes);
      await client.mutation(api.illustrationPipeline.stageIllustrationPose, {
        secret,
        slug: input.slug,
        pose: input.pose,
        storageId,
        mask: input.mask,
        dims: input.dims,
      });
    },

    async failPose(input: {
      slug: string;
      reason?: string;
    }): Promise<void> {
      await client.mutation(api.illustrationPipeline.failIllustrationPose, {
        secret,
        slug: input.slug,
        reason: input.reason,
      });
    },
  };
}
