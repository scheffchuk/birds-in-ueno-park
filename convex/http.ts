import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { auth } from "./auth";

const http = httpRouter();

auth.addHttpRoutes(http);

async function serveStorageBlob(
  ctx: { storage: { get: (id: Id<"_storage">) => Promise<Blob | null> } },
  storageId: Id<"_storage"> | null,
): Promise<Response> {
  if (!storageId) {
    return new Response("Not found", { status: 404 });
  }
  const blob = await ctx.storage.get(storageId);
  if (!blob) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(blob, {
    status: 200,
    headers: {
      "Content-Type": blob.type || "image/jpeg",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}

/**
 * Anatomy refs for xAI edit.
 * - `/refs/anatomy/:slug` — perched (legacy)
 * - `/refs/anatomy/perch/:slug`
 * - `/refs/anatomy/flight/:slug`
 */
http.route({
  pathPrefix: "/refs/anatomy/",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const rest = url.pathname
      .replace(/^\/refs\/anatomy\//, "")
      .replace(/\/$/, "");
    if (!rest) {
      return new Response("Bad request", { status: 400 });
    }

    const parts = rest.split("/");
    let pose: "perch" | "flight" = "perch";
    let slug: string;
    if (parts.length === 1 && parts[0]) {
      slug = parts[0];
    } else if (
      parts.length === 2 &&
      (parts[0] === "perch" || parts[0] === "flight") &&
      parts[1]
    ) {
      pose = parts[0];
      slug = parts[1];
    } else {
      return new Response("Bad request", { status: 400 });
    }

    const storageId = await ctx.runQuery(
      internal.illustrationPipeline.resolveAnatomyStorage,
      { slug, pose },
    );
    return serveStorageBlob(ctx, storageId);
  }),
});

/** Stable public style-print ref for Gemini generate. */
http.route({
  pathPrefix: "/refs/style/",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const key = url.pathname
      .replace(/^\/refs\/style\//, "")
      .replace(/\/$/, "");
    if (!key || key.includes("/")) {
      return new Response("Bad request", { status: 400 });
    }
    const normalized = key.replace(/\.(jpe?g|png|webp)$/i, "");
    const storageId: Id<"_storage"> | null = await ctx.runQuery(
      internal.illustrationPipeline.resolveStyleStorage,
      { key: normalized },
    );
    return serveStorageBlob(ctx, storageId);
  }),
});

export default http;
