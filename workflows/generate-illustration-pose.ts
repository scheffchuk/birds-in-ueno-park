/**
 * Per-pose post-pipeline: download Batchwork URL → fal mat → sharp mask → verify → stage.
 */
import { FatalError } from "workflow";

export type PoseWorkflowInput = {
  customId: string;
  imageUrl: string;
  sciName: string;
  comNameEn: string;
};

export async function processIllustrationPose(input: PoseWorkflowInput) {
  "use workflow";

  const bytes = await downloadResultImage(input.imageUrl);
  const matted = await matteWithFal(bytes);
  const processed = await cropAndMask(matted);

  let verified = await verifyWithVision({
    pngBytes: processed.png,
    sciName: input.sciName,
    comNameEn: input.comNameEn,
  });
  // Retry verify once before failing the species closed.
  if (!verified.ok) {
    verified = await verifyWithVision({
      pngBytes: processed.png,
      sciName: input.sciName,
      comNameEn: input.comNameEn,
    });
  }
  if (!verified.ok) {
    await failSpecies(input.customId, verified.reason);
    throw new FatalError(verified.reason ?? "verify failed");
  }
  await stagePose({
    customId: input.customId,
    pngBytes: processed.png,
    mask: processed.mask,
    dims: processed.dims,
  });
  return { customId: input.customId, status: "staged" as const };
}

async function downloadResultImage(url: string): Promise<ArrayBuffer> {
  "use step";
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Download failed: ${res.status}`);
  }
  return await res.arrayBuffer();
}

async function matteWithFal(bytes: ArrayBuffer): Promise<ArrayBuffer> {
  "use step";
  const { fal } = await import("@fal-ai/client");
  const dataUrl = `data:image/png;base64,${Buffer.from(bytes).toString("base64")}`;
  const result = await fal.subscribe("fal-ai/birefnet/v2", {
    input: {
      image_url: dataUrl,
      model: "Matting",
      output_format: "png",
    },
  });
  const outUrl = (result.data as { image?: { url?: string } })?.image?.url;
  if (!outUrl) throw new Error("fal BiRefNet returned no image URL");
  const res = await fetch(outUrl);
  if (!res.ok) throw new Error(`fal download failed: ${res.status}`);
  return await res.arrayBuffer();
}

async function cropAndMask(matted: ArrayBuffer): Promise<{
  png: Buffer;
  mask: { w: number; h: number; bits: string };
  dims: number[];
}> {
  "use step";
  const sharp = (await import("sharp")).default;
  const { packMaskBits, scaleDims } = await import(
    "../src/lib/admin/mask-bits"
  );

  const image = sharp(Buffer.from(matted)).ensureAlpha();
  const { data, info } = await image
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  const alpha = new Uint8Array(width * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const a = data[(y * width + x) * 4 + 3] ?? 0;
      alpha[y * width + x] = a;
      if (a > 127) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < minX || maxY < minY) {
    throw new Error("Matting produced empty silhouette");
  }

  const boxW = maxX - minX + 1;
  const boxH = maxY - minY + 1;
  const pad = Math.round(0.02 * Math.max(boxW, boxH));
  const left = Math.max(0, minX - pad);
  const top = Math.max(0, minY - pad);
  const right = Math.min(width, maxX + 1 + pad);
  const bottom = Math.min(height, maxY + 1 + pad);
  const cw = right - left;
  const ch = bottom - top;

  const croppedAlpha = new Uint8Array(cw * ch);
  for (let y = 0; y < ch; y += 1) {
    for (let x = 0; x < cw; x += 1) {
      croppedAlpha[y * cw + x] = alpha[(top + y) * width + (left + x)] ?? 0;
    }
  }

  const png = await sharp(Buffer.from(matted))
    .extract({ left, top, width: cw, height: ch })
    .png()
    .toBuffer();

  return {
    png,
    mask: packMaskBits(croppedAlpha, cw, ch),
    dims: scaleDims(cw, ch),
  };
}

async function verifyWithVision(input: {
  pngBytes: Buffer;
  sciName: string;
  comNameEn: string;
}): Promise<{ ok: boolean; reason?: string }> {
  "use step";
  const { generateObject } = await import("ai");
  const { gateway } = await import("@ai-sdk/gateway");
  const { verifyResultSchema, passesIllustrationVerify } = await import(
    "../src/lib/admin/illustration-verify"
  );

  const dataUrl = `data:image/png;base64,${input.pngBytes.toString("base64")}`;
  const { object } = await generateObject({
    model: gateway("xai/grok-4.1-fast-non-reasoning"),
    schema: verifyResultSchema,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `You are a rigorous ornithologist examining a stylized kachō-e woodblock-style bird illustration. The bird is intended to be a ${input.comNameEn} (${input.sciName}).

Respond with JSON fields only. Be honest: if the species looks wrong, set matchesTarget false. Flag sticks/branches/perches. Count wings, legs, heads, tails.`,
          },
          { type: "image", image: dataUrl },
        ],
      },
    ],
  });

  if (!passesIllustrationVerify(object)) {
    return {
      ok: false,
      reason: `verify rejected: matches=${object.matchesTarget} wings=${object.wingCount} perch=${object.hasStickOrPerch} issues=${object.anatomyIssues}`,
    };
  }
  return { ok: true };
}

async function stagePose(input: {
  customId: string;
  pngBytes: Buffer;
  mask: { w: number; h: number; bits: string };
  dims: number[];
}): Promise<void> {
  "use step";
  const { parseIllustrationCustomId } = await import(
    "../src/lib/admin/illustration-custom-id"
  );
  const { ConvexHttpClient } = await import("convex/browser");
  const { api } = await import("../convex/_generated/api");

  const secret = process.env.ILLUSTRATION_PIPELINE_SECRET;
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!secret || !convexUrl) {
    throw new Error("ILLUSTRATION_PIPELINE_SECRET and NEXT_PUBLIC_CONVEX_URL required");
  }

  const { slug, pose } = parseIllustrationCustomId(input.customId);
  const client = new ConvexHttpClient(convexUrl);

  const uploadUrl = await client.mutation(
    api.illustrationPipeline.generatePipelineUploadUrl,
    { secret },
  );
  const uploadRes = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": "image/png" },
    body: new Uint8Array(input.pngBytes),
  });
  if (!uploadRes.ok) {
    throw new Error(`Convex upload failed: ${uploadRes.status}`);
  }
  const { storageId } = (await uploadRes.json()) as { storageId: string };

  await client.mutation(api.illustrationPipeline.stageIllustrationPose, {
    secret,
    slug,
    pose,
    storageId: storageId as never,
    mask: input.mask,
    dims: input.dims,
  });
}

async function failSpecies(customId: string, reason?: string): Promise<void> {
  "use step";
  const { parseIllustrationCustomId } = await import(
    "../src/lib/admin/illustration-custom-id"
  );
  const { ConvexHttpClient } = await import("convex/browser");
  const { api } = await import("../convex/_generated/api");

  const secret = process.env.ILLUSTRATION_PIPELINE_SECRET;
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!secret || !convexUrl) return;

  const { slug } = parseIllustrationCustomId(customId);
  const client = new ConvexHttpClient(convexUrl);
  await client.mutation(api.illustrationPipeline.failIllustrationPose, {
    secret,
    slug,
    reason,
  });
}
