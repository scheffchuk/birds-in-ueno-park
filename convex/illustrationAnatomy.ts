"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";
import {
  downloadAnatomyBytes,
  resolveAnatomyImageUrl,
} from "./lib/anatomyRef";
import { resolveFlightAnatomyImageUrl } from "./lib/anatomyFlightRef";
import { ANATOMY_MAX_BYTES, ANATOMY_MAX_EDGE } from "./lib/anatomyImageUrl";
import type { Id } from "./_generated/dataModel";

async function compressAnatomyJpeg(
  bytes: ArrayBuffer,
): Promise<{ bytes: Buffer; contentType: string }> {
  const sharp = (await import("sharp")).default;
  const out = await sharp(Buffer.from(bytes))
    .rotate()
    .resize({
      width: ANATOMY_MAX_EDGE,
      height: ANATOMY_MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();
  return { bytes: out, contentType: "image/jpeg" };
}

/**
 * Fetch a Wikipedia / Wikidata perched anatomy photo and store as anatomyRef.
 */
export const ensureAnatomyFromWikipedia = action({
  args: {
    slug: v.string(),
    sciName: v.string(),
    comNameEn: v.optional(v.string()),
    force: v.optional(v.boolean()),
  },
  returns: v.union(
    v.object({
      storageId: v.id("_storage"),
      source: v.string(),
    }),
    v.object({
      error: v.string(),
    }),
  ),
  handler: async (
    ctx,
    args,
  ): Promise<
    | { storageId: Id<"_storage">; source: string }
    | { error: string }
  > => {
    const isAdmin = await ctx.runQuery(api.admin.viewerIsAdmin, {});
    if (!isAdmin) throw new Error("Unauthorized");

    if (!args.force) {
      const existing: Id<"_storage"> | null = await ctx.runQuery(
        internal.illustrationPipeline.resolveAnatomyStorage,
        { slug: args.slug, pose: "perch" },
      );
      if (existing) {
        return { storageId: existing, source: "existing" };
      }
    }

    const resolved = await resolveAnatomyImageUrl({
      sciName: args.sciName,
      comNameEn: args.comNameEn ?? args.sciName,
    });
    if (!resolved.ok) {
      console.error("Anatomy resolve failed", args.slug, resolved.reason);
      return { error: resolved.reason };
    }

    const downloaded = await downloadAnatomyBytes(resolved.imageUrl);
    if (!downloaded) {
      console.error("Anatomy download failed", args.slug, resolved.imageUrl);
      return { error: `Download failed: ${resolved.imageUrl}` };
    }

    const compressed = await compressAnatomyJpeg(downloaded.bytes);
    const blob = new Blob([new Uint8Array(compressed.bytes)], {
      type: compressed.contentType,
    });
    const storageId = await ctx.storage.store(blob);

    await ctx.runMutation(internal.illustrationPipeline.setAnatomyRefInternal, {
      slug: args.slug,
      storageId,
      pose: "perch",
    });
    return { storageId, source: resolved.source };
  },
});

/**
 * Fetch an in-flight anatomy photo (iNaturalist first, Commons fallback)
 * and store as anatomyRefFlight.
 */
export const ensureFlightAnatomyFromCommons = action({
  args: {
    slug: v.string(),
    sciName: v.string(),
    comNameEn: v.optional(v.string()),
    force: v.optional(v.boolean()),
  },
  returns: v.union(
    v.object({
      storageId: v.id("_storage"),
      source: v.string(),
    }),
    v.object({
      error: v.string(),
    }),
  ),
  handler: async (
    ctx,
    args,
  ): Promise<
    | { storageId: Id<"_storage">; source: string }
    | { error: string }
  > => {
    const isAdmin = await ctx.runQuery(api.admin.viewerIsAdmin, {});
    if (!isAdmin) throw new Error("Unauthorized");

    if (!args.force) {
      const existing: Id<"_storage"> | null = await ctx.runQuery(
        internal.illustrationPipeline.resolveAnatomyStorage,
        { slug: args.slug, pose: "flight" },
      );
      if (existing) {
        return { storageId: existing, source: "existing" };
      }
    }

    const resolved = await resolveFlightAnatomyImageUrl({
      sciName: args.sciName,
      comNameEn: args.comNameEn ?? args.sciName,
    });
    if (!resolved.ok) {
      console.error("Flight anatomy resolve failed", args.slug, resolved.reason);
      return { error: resolved.reason };
    }

    const downloaded = await downloadAnatomyBytes(resolved.imageUrl);
    if (!downloaded) {
      console.error(
        "Flight anatomy download failed",
        args.slug,
        resolved.imageUrl,
      );
      return { error: `Download failed: ${resolved.imageUrl}` };
    }

    const compressed = await compressAnatomyJpeg(downloaded.bytes);
    const blob = new Blob([new Uint8Array(compressed.bytes)], {
      type: compressed.contentType,
    });
    const storageId = await ctx.storage.store(blob);

    await ctx.runMutation(internal.illustrationPipeline.setAnatomyRefInternal, {
      slug: args.slug,
      storageId,
      pose: "flight",
    });
    return { storageId, source: resolved.source };
  },
});

/**
 * Re-encode anatomy refs that are too large for HTTP serving / xAI fetch.
 */
export const shrinkOversizedAnatomyRefs = action({
  args: {
    maxBytes: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  returns: v.object({
    checked: v.number(),
    shrunk: v.number(),
    skipped: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const isAdmin = await ctx.runQuery(api.admin.viewerIsAdmin, {});
    if (!isAdmin) throw new Error("Unauthorized");

    const maxBytes = args.maxBytes ?? ANATOMY_MAX_BYTES;
    const limit = args.limit ?? 80;
    const rows = await ctx.runQuery(
      internal.illustrationPipeline.listAnatomyRefsInternal,
      {},
    );

    let checked = 0;
    let shrunk = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const row of rows) {
      if (checked >= limit) break;
      checked += 1;

      const blob = await ctx.storage.get(row.storageId);
      if (!blob) {
        errors.push(`${row.slug}/${row.pose}: missing blob`);
        continue;
      }
      const raw = await blob.arrayBuffer();
      if (raw.byteLength <= maxBytes) {
        skipped += 1;
        continue;
      }

      try {
        const compressed = await compressAnatomyJpeg(raw);
        const next = new Blob([new Uint8Array(compressed.bytes)], {
          type: compressed.contentType,
        });
        const storageId = await ctx.storage.store(next);
        await ctx.runMutation(
          internal.illustrationPipeline.setAnatomyRefInternal,
          { slug: row.slug, storageId, pose: row.pose },
        );
        shrunk += 1;
        console.log("Shrunk anatomy", {
          slug: row.slug,
          pose: row.pose,
          before: raw.byteLength,
          after: compressed.bytes.byteLength,
        });
      } catch (e) {
        errors.push(
          `${row.slug}/${row.pose}: ${e instanceof Error ? e.message : "compress failed"}`,
        );
      }
    }

    return { checked, shrunk, skipped, errors };
  },
});
