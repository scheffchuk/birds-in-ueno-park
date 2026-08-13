import type { Doc } from "../_generated/dataModel";

export type IllustrationPose = Doc<"stylePrints">["pose"];

const POSES = new Set<IllustrationPose>(["perch", "flight"]);

/** Pose workflow customId: `{slug}:{pose}`. */
export function formatIllustrationCustomId(
  slug: string,
  pose: IllustrationPose,
): string {
  return `${slug}:${pose}`;
}

export function parseIllustrationCustomId(customId: string): {
  slug: string;
  pose: IllustrationPose;
} {
  const sep = customId.lastIndexOf(":");
  if (sep <= 0 || sep === customId.length - 1) {
    throw new Error(`Invalid illustration customId: ${customId}`);
  }
  const slug = customId.slice(0, sep);
  const poseRaw = customId.slice(sep + 1);
  if (!slug) throw new Error(`Invalid illustration customId slug: ${customId}`);
  if (!POSES.has(poseRaw as IllustrationPose)) {
    throw new Error(`Invalid illustration pose in customId: ${customId}`);
  }
  return { slug, pose: poseRaw as IllustrationPose };
}
