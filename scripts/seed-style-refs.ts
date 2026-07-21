/**
 * Upload public/refs/style/{perch,flight}.jpg into Convex stylePrints
 * so Batchwork can fetch them at CONVEX_SITE_URL/refs/style/:key
 *
 * Usage: pnpm seed:style-refs
 * Needs: NEXT_PUBLIC_CONVEX_URL + ILLUSTRATION_PIPELINE_SECRET in .env.local
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const root = resolve(import.meta.dirname, "..");

async function uploadStyle(
  client: ConvexHttpClient,
  secret: string,
  pose: "perch" | "flight",
  filePath: string,
) {
  const bytes = readFileSync(filePath);
  const uploadUrl = await client.mutation(
    api.illustrationPipeline.generatePipelineUploadUrl,
    { secret },
  );
  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": "image/jpeg" },
    body: bytes,
  });
  if (!res.ok) throw new Error(`Upload failed for ${pose}: ${res.status}`);
  const { storageId } = (await res.json()) as { storageId: string };
  await client.mutation(api.illustrationPipeline.upsertStylePrintPipeline, {
    secret,
    key: pose,
    pose,
    storageId: storageId as never,
  });
  console.log(`style ${pose} → ${storageId}`);
}

async function main() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  const secret = process.env.ILLUSTRATION_PIPELINE_SECRET;
  if (!url) {
    console.error("NEXT_PUBLIC_CONVEX_URL required");
    process.exit(1);
  }
  if (!secret) {
    console.error("ILLUSTRATION_PIPELINE_SECRET required");
    process.exit(1);
  }

  const perch = resolve(root, "public/refs/style/perch.jpg");
  const flight = resolve(root, "public/refs/style/flight.jpg");
  if (!existsSync(perch) || !existsSync(flight)) {
    console.error("Missing public/refs/style/perch.jpg or flight.jpg");
    process.exit(1);
  }

  const client = new ConvexHttpClient(url);
  await uploadStyle(client, secret, "perch", perch);
  await uploadStyle(client, secret, "flight", flight);

  const site =
    process.env.NEXT_PUBLIC_CONVEX_SITE_URL ??
    process.env.CONVEX_SITE_URL ??
    "(set CONVEX_SITE_URL)";
  console.log(`Done. Public URLs:`);
  console.log(`  ${site}/refs/style/perch`);
  console.log(`  ${site}/refs/style/flight`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
