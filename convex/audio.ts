import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  audioSourceMetadataFields,
  speciesEbirdValidator,
  speciesWikipediaValidator,
} from "./lib/audio";

const availableAudioValidator = v.object({
  status: v.literal("available"),
  storageId: v.id("_storage"),
  sourceUrl: v.string(),
  catalogueNumber: v.string(),
  recordist: v.string(),
  ...audioSourceMetadataFields,
  licenseUrl: v.string(),
  license: v.string(),
  nonCommercial: v.boolean(),
  durationSeconds: v.number(),
  sha256: v.string(),
  bytes: v.number(),
  contentType: v.optional(v.string()),
});

const unavailableAudioValidator = v.object({
  status: v.literal("unavailable"),
  reason: v.string(),
});

const syncAudioValidator = v.union(
  availableAudioValidator,
  unavailableAudioValidator,
);

function requireAudioSyncSecret(secret: string): void {
  const expected = process.env.AUDIO_SYNC_SECRET;
  if (!expected || secret !== expected) throw new Error("Unauthorized audio sync request");
}

/** Hashes and storage IDs used by the local sync command to skip unchanged files. */
export const listSyncState = query({
  args: { secret: v.string(), slugs: v.array(v.string()) },
  returns: v.array(
    v.object({
      slug: v.string(),
      audio: v.optional(
        v.object({
          status: v.union(v.literal("available"), v.literal("unavailable")),
          sha256: v.optional(v.string()),
          storageId: v.optional(v.id("_storage")),
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    requireAudioSyncSecret(args.secret);
    const rows = [];
    const missing: string[] = [];
    for (const slug of args.slugs) {
      const species = await ctx.db
        .query("species")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .unique();
      if (!species) {
        missing.push(slug);
        continue;
      }
      const audio = species.audio;
      rows.push({
        slug,
        ...(audio
          ? {
              audio: {
                status: audio.status,
                ...(audio.sha256 ? { sha256: audio.sha256 } : {}),
                ...(audio.storageId ? { storageId: audio.storageId } : {}),
              },
            }
          : {}),
      });
    }
    if (missing.length > 0) {
      throw new Error(`Species not found: ${missing.join(", ")}`);
    }
    return rows;
  },
});

/** Store generated media metadata and replace the old blob only after the patch succeeds. */
export const syncSpeciesMedia = mutation({
  args: {
    secret: v.string(),
    slug: v.string(),
    audio: syncAudioValidator,
    ebird: v.optional(v.union(speciesEbirdValidator, v.null())),
    wikipedia: v.optional(v.union(speciesWikipediaValidator, v.null())),
  },
  returns: v.object({ deletedPreviousStorage: v.boolean() }),
  handler: async (ctx, args) => {
    requireAudioSyncSecret(args.secret);
    const species = await ctx.db
      .query("species")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (!species) throw new Error(`Species not found: ${args.slug}`);

    const previousStorageId = species.audio?.storageId;
    const nextAudio = args.audio.status === "available"
      ? {
          ...args.audio,
          storageId: args.audio.storageId,
        }
      : {
          status: "unavailable" as const,
          unavailableReason: args.audio.reason,
        };

    const nextStorageId = args.audio.status === "available"
      ? args.audio.storageId
      : undefined;
    const hasNewUpload =
      nextStorageId !== undefined && previousStorageId !== nextStorageId;

    try {
      await ctx.db.patch(species._id, {
        audio: nextAudio,
        ...(args.ebird !== undefined ? { ebird: args.ebird ?? undefined } : {}),
        ...(args.wikipedia !== undefined
          ? { wikipedia: args.wikipedia ?? undefined }
          : {}),
      });

      if (previousStorageId && previousStorageId !== nextStorageId) {
        await ctx.storage.delete(previousStorageId);
        return { deletedPreviousStorage: true };
      }
    } catch (error) {
      if (hasNewUpload && nextStorageId) {
        await ctx.storage.delete(nextStorageId);
      }
      throw error;
    }
    return { deletedPreviousStorage: false };
  },
});

/** Short-lived upload URL for the explicit local audio sync command. */
export const generateAudioUploadUrl = mutation({
  args: { secret: v.string() },
  returns: v.string(),
  handler: async (ctx, args) => {
    requireAudioSyncSecret(args.secret);
    return await ctx.storage.generateUploadUrl();
  },
});
