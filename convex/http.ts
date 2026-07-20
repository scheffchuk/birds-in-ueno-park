import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { auth } from "./auth";

const http = httpRouter();

auth.addHttpRoutes(http);

/** Stable public anatomy ref for Batchwork (not a short-lived signed URL). */
http.route({
  pathPrefix: "/refs/anatomy/",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const slug = url.pathname
      .replace(/^\/refs\/anatomy\//, "")
      .replace(/\/$/, "");
    if (!slug || slug.includes("/")) {
      return new Response("Bad request", { status: 400 });
    }
    const storageId = await ctx.runQuery(
      internal.illustrationPipeline.resolveAnatomyStorage,
      { slug },
    );
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
  }),
});

/** Stable public style-print ref for Batchwork. */
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
  }),
});

export default http;
