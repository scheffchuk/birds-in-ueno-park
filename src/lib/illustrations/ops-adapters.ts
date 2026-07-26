import { start } from "workflow/api";
import { processIllustrationPose } from "../../../workflows/generate-illustration-pose";
import type { Id } from "../../../convex/_generated/dataModel";
import { geminiImageEdit } from "./gemini-image-edit";
import type {
  IllustrationGenerateAdapters,
  IllustrationRejectRegenAdapters,
} from "./ops";
import {
  api,
  pipelineClient,
  pipelineSecret,
} from "./pipeline-client";

type PipelineHttpClient = ReturnType<typeof pipelineClient>;

function authedPipelineClient(token: string): PipelineHttpClient {
  const client = pipelineClient();
  client.setAuth(token);
  return client;
}

/** Wire real Convex / Gemini / Workflow adapters for the generate HTTP entrypoint. */
export function createIllustrationGenerateAdapters(
  token: string,
  client: PipelineHttpClient = authedPipelineClient(token),
): IllustrationGenerateAdapters {
  const secret = pipelineSecret();

  return {
    prepare: async (input) =>
      client.mutation(api.illustrationPipeline.prepareIllustrationGenerate, {
        limit: input.limit ?? 20,
        slugs: input.slugs,
        poses: input.poses,
      }),
    edit: async ({ prompt, imageUrls }) =>
      geminiImageEdit({ prompt, imageUrls }),
    uploadPng: async (pngBytes) => uploadPipelinePng(client, secret, pngBytes),
    startWorkflow: async (input) => {
      await start(processIllustrationPose, [input]);
    },
    failPose: async ({ slug, reason }) => {
      await client.mutation(api.illustrationPipeline.failIllustrationPose, {
        secret,
        slug,
        reason,
      });
    },
  };
}

/** Generate adapters plus Convex reject for reject-and-regenerate ops. */
export function createIllustrationRejectRegenAdapters(
  token: string,
): IllustrationRejectRegenAdapters {
  const client = authedPipelineClient(token);
  return {
    ...createIllustrationGenerateAdapters(token, client),
    reject: async (input) =>
      client.mutation(api.illustrationPipeline.rejectAndRegenerate, {
        speciesId: input.speciesId as Id<"species">,
        pose: input.pose,
      }),
  };
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
  const uploaded: unknown = await uploadRes.json();
  if (
    typeof uploaded !== "object" ||
    uploaded === null ||
    !("storageId" in uploaded) ||
    typeof uploaded.storageId !== "string"
  ) {
    throw new Error("Convex upload missing storageId");
  }
  const storageId = uploaded.storageId as Id<"_storage">;
  const url = await client.mutation(
    api.illustrationPipeline.getPipelineStorageUrl,
    { secret, storageId },
  );
  if (!url) throw new Error("Convex storage URL missing after upload");
  return url;
}
