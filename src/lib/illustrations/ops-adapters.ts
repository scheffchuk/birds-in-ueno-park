import { start } from "workflow/api";
import { processIllustrationPose } from "../../../workflows/generate-illustration-pose";
import type { Id } from "../../../convex/_generated/dataModel";
import { geminiImageEdit } from "./gemini-image-edit";
import type {
  IllustrationAnatomySeedAdapters,
  IllustrationGenerateAdapters,
  IllustrationRejectRegenAdapters,
} from "./ops";
import {
  api,
  pipelineClient,
  pipelineSecret,
} from "./pipeline-client";
import { createPipelineStorage } from "./pipeline-storage";

type PipelineHttpClient = ReturnType<typeof pipelineClient>;

function authedPipelineClient(token: string): PipelineHttpClient {
  const client = pipelineClient();
  client.setAuth(token);
  return client;
}

/** Wire Convex anatomy ensure actions for the seed-anatomy HTTP entrypoint. */
export function createIllustrationAnatomySeedAdapters(
  token: string,
  client: PipelineHttpClient = authedPipelineClient(token),
): IllustrationAnatomySeedAdapters {
  return {
    ensure: async ({ slug, sciName, comNameEn, pose }) => {
      const args = { slug, sciName, comNameEn };
      if (pose === "flight") {
        return client.action(
          api.illustrationAnatomy.ensureFlightAnatomyFromCommons,
          args,
        );
      }
      return client.action(
        api.illustrationAnatomy.ensureAnatomyFromWikipedia,
        args,
      );
    },
    delay: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  };
}

/** Wire real Convex / Gemini / Workflow adapters for the generate HTTP entrypoint. */
export function createIllustrationGenerateAdapters(
  token: string,
  client: PipelineHttpClient = authedPipelineClient(token),
): IllustrationGenerateAdapters {
  const storage = createPipelineStorage({
    client,
    secret: pipelineSecret(),
  });

  return {
    prepare: async (input) =>
      client.mutation(api.illustrationPipeline.prepareIllustrationGenerate, {
        limit: input.limit ?? 20,
        slugs: input.slugs,
        poses: input.poses,
      }),
    edit: async ({ prompt, imageUrls }) =>
      geminiImageEdit({ prompt, imageUrls }),
    uploadPng: async (pngBytes) => storage.uploadPngForUrl(pngBytes),
    startWorkflow: async (input) => {
      await start(processIllustrationPose, [input]);
    },
    failPose: async ({ slug, reason }) => {
      await storage.failPose({ slug, reason });
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
