"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";

/**
 * Fetch a Wikipedia summary thumbnail for the scientific name and store as anatomyRef.
 */
export const ensureAnatomyFromWikipedia = action({
  args: {
    slug: v.string(),
    sciName: v.string(),
    force: v.optional(v.boolean()),
  },
  returns: v.union(v.id("_storage"), v.null()),
  handler: async (ctx, args) => {
    const isAdmin = await ctx.runQuery(api.admin.viewerIsAdmin, {});
    if (!isAdmin) throw new Error("Unauthorized");

    const title = args.sciName.replace(/ /g, "_");
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const summaryRes = await fetch(summaryUrl, {
      headers: { Accept: "application/json" },
    });
    if (!summaryRes.ok) {
      console.error("Wikipedia summary failed", args.slug, summaryRes.status);
      return null;
    }
    const summary = (await summaryRes.json()) as {
      originalimage?: { source?: string };
      thumbnail?: { source?: string };
    };
    const imageUrl =
      summary.originalimage?.source ?? summary.thumbnail?.source;
    if (!imageUrl) {
      console.error("No Wikipedia image for", args.slug);
      return null;
    }

    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      console.error("Wikipedia image download failed", args.slug, imgRes.status);
      return null;
    }
    const bytes = await imgRes.arrayBuffer();
    const contentType = imgRes.headers.get("content-type") ?? "image/jpeg";
    const blob = new Blob([bytes], { type: contentType });
    const storageId = await ctx.storage.store(blob);

    await ctx.runMutation(internal.illustrationPipeline.setAnatomyRefInternal, {
      slug: args.slug,
      storageId,
    });
    return storageId;
  },
});
