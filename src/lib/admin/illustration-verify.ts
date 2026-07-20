import { z } from "zod";

export const verifyResultSchema = z.object({
  matchesTarget: z.boolean(),
  wingCount: z.number().int(),
  legCount: z.number().int(),
  headCount: z.number().int(),
  tailCount: z.number().int(),
  hasStickOrPerch: z.boolean(),
  anatomyIssues: z.string(),
});

export type VerifyResult = z.infer<typeof verifyResultSchema>;

/** Fail closed: must match target, sane anatomy, no stick/perch. */
export function passesIllustrationVerify(result: VerifyResult): boolean {
  if (!result.matchesTarget) return false;
  if (result.hasStickOrPerch) return false;
  if (result.wingCount !== 2) return false;
  if (result.headCount !== 1) return false;
  if (result.tailCount !== 1) return false;
  if (result.legCount < 1 || result.legCount > 2) return false;
  if (result.anatomyIssues.trim().length > 0) return false;
  return true;
}
