/**
 * Per-pose post-pipeline: download → fal (or cream-key) mat → sharp mask → verify → stage.
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

  const { parseIllustrationCustomId } = await import(
    "../src/lib/admin/illustration-custom-id"
  );
  const { pose } = parseIllustrationCustomId(input.customId);

  let verified = await verifyWithVision({
    pngBytes: processed.png,
    sciName: input.sciName,
    comNameEn: input.comNameEn,
    pose,
  });
  // Retry verify once before failing the species closed.
  if (!verified.ok) {
    verified = await verifyWithVision({
      pngBytes: processed.png,
      sciName: input.sciName,
      comNameEn: input.comNameEn,
      pose,
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
  try {
    return await matteViaFal(bytes);
  } catch (err) {
    const detail = falErrorDetail(err);
    console.warn("fal matting failed; falling back to cream-key", detail);
    return await matteViaCreamKey(bytes);
  }
}

function falErrorDetail(err: unknown): string {
  if (err && typeof err === "object") {
    const body = "body" in err ? err.body : undefined;
    if (body && typeof body === "object" && body !== null && "detail" in body) {
      return String(body.detail);
    }
    if ("message" in err && typeof err.message === "string") {
      return err.message;
    }
  }
  return String(err);
}

async function matteViaFal(bytes: ArrayBuffer): Promise<ArrayBuffer> {
  const { fal } = await import("@fal-ai/client");
  const key = process.env.FAL_KEY;
  if (!key) {
    throw new Error("FAL_KEY not set");
  }
  fal.config({ credentials: key });

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

async function matteViaCreamKey(bytes: ArrayBuffer): Promise<ArrayBuffer> {
  const sharp = (await import("sharp")).default;
  const { applyCreamKeyRgba } = await import(
    "../src/lib/illustrations/cream-matte"
  );

  const image = sharp(Buffer.from(bytes)).ensureAlpha();
  const { data, info } = await image
    .raw()
    .toBuffer({ resolveWithObject: true });
  const rgba = applyCreamKeyRgba(
    new Uint8Array(data),
    info.width,
    info.height,
  );
  const png = await sharp(Buffer.from(rgba), {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
  return png.buffer.slice(
    png.byteOffset,
    png.byteOffset + png.byteLength,
  ) as ArrayBuffer;
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
  pose: "perch" | "flight";
}): Promise<{ ok: boolean; reason?: string }> {
  "use step";
  const { generateObject } = await import("ai");
  const { createXai } = await import("@ai-sdk/xai");
  const sharp = (await import("sharp")).default;
  const { verifyResultSchema, passesIllustrationVerify } = await import(
    "../src/lib/admin/illustration-verify"
  );

  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return { ok: false, reason: "XAI_API_KEY required for vision verify" };
  }

  // Keep vision payload small; Gateway/Vertex also choke on huge data-URI images.
  const visionPng = await sharp(input.pngBytes)
    .resize({ width: 1280, height: 1280, fit: "inside", withoutEnlargement: true })
    .png()
    .toBuffer();

  const poseNote =
    input.pose === "flight"
      ? "This is a FLIGHT pose: both wings should be visible/extended. Legs may be tucked (count 0–2)."
      : "This is a PERCHED side/profile pose: often only ONE wing and ONE leg are visible — that is OK.";

  const xai = createXai({ apiKey });
  try {
    const { object } = await generateObject({
      // Direct xAI — Gateway routes grok-4.1-fast* vision via Vertex and 400s.
      model: xai("grok-4-fast"),
      schema: verifyResultSchema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are a rigorous ornithologist examining a stylized kachō-e woodblock-style bird illustration. The bird is intended to be a ${input.comNameEn} (${input.sciName}).

${poseNote}

Respond with JSON fields only. Be honest: if the species looks wrong, set matchesTarget false. Flag sticks/branches/perches. Count only body parts that are clearly visible.
If there are no anatomy problems, set anatomyIssues to an empty string (not the word "none").`,
            },
            { type: "file", data: visionPng, mediaType: "image/png" },
          ],
        },
      ],
    });

    if (!passesIllustrationVerify(object, input.pose)) {
      return {
        ok: false,
        reason: `verify rejected: matches=${object.matchesTarget} wings=${object.wingCount} legs=${object.legCount} perch=${object.hasStickOrPerch} issues=${object.anatomyIssues}`,
      };
    }
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, reason: `verify API error: ${message}` };
  }
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
