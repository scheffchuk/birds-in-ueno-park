import { generateText, gateway } from "ai";
import sharp from "sharp";

export type GeminiImageEditInput = {
  prompt: string;
  /** Public HTTPS image URLs (anatomy, style, …). */
  imageUrls: string[];
  /** Gateway model id. */
  model?: string;
};

export type GeminiImageEditResult = {
  /** PNG bytes from Gemini. */
  pngBytes: Buffer;
};

const DEFAULT_MODEL = "google/gemini-2.5-flash-image";
/** Match AvianVisitors: shrink anatomy so photo style doesn't dominate. */
const REF_MAX_EDGE = 384;

/**
 * Sync Gemini Flash Image edit via AI Gateway (multi-image generateText).
 * Matches the reference AvianVisitors pregen path, cheaper than Grok Imagine Quality.
 */
export async function geminiImageEdit(
  input: GeminiImageEditInput,
): Promise<GeminiImageEditResult> {
  if (!process.env.AI_GATEWAY_API_KEY) {
    throw new Error("AI_GATEWAY_API_KEY required for Gemini image edit");
  }

  const modelId = input.model ?? DEFAULT_MODEL;
  const refParts: Array<
    | { type: "text"; text: string }
    | { type: "file"; data: Buffer; mediaType: "image/png" }
  > = [];

  for (let i = 0; i < input.imageUrls.length; i += 1) {
    const url = input.imageUrls[i]!;
    const label =
      i === 0
        ? "IMAGE 1 (positive, anatomy):"
        : i === 1
          ? "IMAGE 2 (positive, style):"
          : `IMAGE ${i + 1}:`;
    const png = await fetchAndDownscaleRef(url);
    refParts.push({ type: "text", text: label });
    refParts.push({ type: "file", data: png, mediaType: "image/png" });
  }

  const result = await generateText({
    model: gateway(modelId),
    messages: [
      {
        role: "user",
        content: [{ type: "text", text: input.prompt }, ...refParts],
      },
    ],
    providerOptions: {
      google: { responseModalities: ["TEXT", "IMAGE"] },
    },
  });

  const image = result.files?.find((f) => f.mediaType.startsWith("image/"));
  if (!image) {
    throw new Error("Gemini returned no image file");
  }
  return { pngBytes: Buffer.from(image.uint8Array) };
}

async function fetchAndDownscaleRef(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Ref fetch failed ${res.status}: ${url}`);
  }
  const raw = Buffer.from(await res.arrayBuffer());
  return sharp(raw)
    .rotate()
    .resize({
      width: REF_MAX_EDGE,
      height: REF_MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .png()
    .toBuffer();
}
