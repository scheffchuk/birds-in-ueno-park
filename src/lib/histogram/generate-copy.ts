import { generateText, Output, gateway } from "ai";
import { z } from "zod";
import type { SpeciesCopy } from "./copy-plan";
import type { GuideSpeciesSeed } from "./seed-plan";

const speciesCopySchema = z.object({
  descriptionEn: z.string(),
  descriptionJa: z.string(),
  descriptionZhTw: z.string(),
  spottingTipsEn: z.string(),
  spottingTipsJa: z.string(),
  spottingTipsZhTw: z.string(),
});

export type GenerateCopyInput = Pick<
  GuideSpeciesSeed,
  "sciName" | "comNameEn" | "comNameJa" | "comNameZhTw"
>;

/** Call xAI Grok via Vercel AI Gateway for trilingual copy. */
export async function generateSpeciesCopy(
  input: GenerateCopyInput,
): Promise<SpeciesCopy> {
  const { output } = await generateText({
    model: gateway("xai/grok-4.1-fast-non-reasoning"),
    output: Output.object({ schema: speciesCopySchema }),
    prompt: `You write short field-guide copy for wild birds regularly seen at Ueno Park and Shinobazu Pond in Tokyo.

Species:
- Scientific: ${input.sciName}
- English: ${input.comNameEn}
- Japanese: ${input.comNameJa}
- Traditional Chinese (Taiwan): ${input.comNameZhTw}

Return:
- descriptionEn / descriptionJa / descriptionZhTw: 2–4 sentences each about appearance and habits relevant to this park/pond setting. Natural, editorial, no marketing fluff.
- spottingTipsEn / spottingTipsJa / spottingTipsZhTw: 1–3 concrete sentences each on where/when to look around Ueno / Shinobazu (habitats, seasons, behavior). No GPS coordinates.

Write each language field in that language. Do not mix languages within a field.`,
  });

  if (!output) {
    throw new Error(`No structured copy for ${input.sciName}`);
  }
  return output;
}
