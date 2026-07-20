/**
 * Upload public/refs/style/{perch,flight}.jpg into Convex stylePrints
 * and register keys so /refs/style/:key HTTP also works.
 *
 * Usage: pnpm seed:style-refs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const root = resolve(import.meta.dirname, "..");

async function uploadStyle(
  client: ConvexHttpClient,
  pose: "perch" | "flight",
  filePath: string,
) {
  const bytes = readFileSync(filePath);
  const uploadUrl = await client.mutation(api.admin.generateUploadUrl, {});
  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": "image/jpeg" },
    body: bytes,
  });
  if (!res.ok) throw new Error(`Upload failed for ${pose}: ${res.status}`);
  const { storageId } = (await res.json()) as { storageId: string };
  await client.mutation(api.illustrationPipeline.upsertStylePrint, {
    key: pose,
    pose,
    storageId: storageId as never,
  });
  console.log(`style ${pose} → ${storageId}`);
}

async function main() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  const token = process.env.CONVEX_ADMIN_TOKEN;
  if (!url) {
    console.error("NEXT_PUBLIC_CONVEX_URL required");
    process.exit(1);
  }
  if (!token) {
    console.error(
      "CONVEX_ADMIN_TOKEN required (admin session JWT). Sign in at /admin and copy from localStorage, or run upload via Admin UI.",
    );
    process.exit(1);
  }

  const perch = resolve(root, "public/refs/style/perch.jpg");
  const flight = resolve(root, "public/refs/style/flight.jpg");
  if (!existsSync(perch) || !existsSync(flight)) {
    console.error("Missing public/refs/style/perch.jpg or flight.jpg");
    process.exit(1);
  }

  const client = new ConvexHttpClient(url);
  client.setAuth(token);
  await uploadStyle(client, "perch", perch);
  await uploadStyle(client, "flight", flight);
  console.log("Done. Style also served at /refs/style/{perch,flight}.jpg");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
