import { z } from "zod";
import type { IllustrationPose } from "../../../convex/lib/illustrationCustomId";

export const verifyResultSchema = z.object({
  matchesTarget: z.boolean(),
  wingCount: z.number().int(),
  legCount: z.number().int(),
  headCount: z.number().int(),
  tailCount: z.number().int(),
  hasStickOrPerch: z.boolean(),
  /** Empty string when clean. Models often write "none" — treat as empty. */
  anatomyIssues: z.string(),
});

export type VerifyResult = z.infer<typeof verifyResultSchema>;

/** True when the model reported no real anatomy problem. */
export function hasRealAnatomyIssues(issues: string): boolean {
  const t = issues.trim().toLowerCase();
  if (t.length === 0) return false;
  return !["none", "n/a", "na", "ok", "no", "no issues", "-", "null"].includes(
    t,
  );
}

/**
 * Fail closed on species mismatch + sticks.
 * Pose-aware counts: perched profile often shows 1 wing / 1 leg.
 */
export function passesIllustrationVerify(
  result: VerifyResult,
  pose: IllustrationPose = "perch",
): boolean {
  if (!result.matchesTarget) return false;
  if (result.hasStickOrPerch) return false;
  if (result.headCount !== 1) return false;
  if (result.tailCount !== 1) return false;
  if (hasRealAnatomyIssues(result.anatomyIssues)) return false;

  if (pose === "flight") {
    if (result.wingCount !== 2) return false;
    // Feet often tucked / invisible in flight.
    if (result.legCount < 0 || result.legCount > 2) return false;
  } else {
    // Side perch: one wing folded out of view is normal.
    if (result.wingCount < 1 || result.wingCount > 2) return false;
    if (result.legCount < 1 || result.legCount > 2) return false;
  }
  return true;
}
