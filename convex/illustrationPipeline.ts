import { v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
  type MutationCtx,
} from "./_generated/server";
import { requireAdmin } from "./lib/auth";
import {
  planFailIllustrationPose,
  planStageIllustrationPose,
} from "./lib/illustration";
import { selectSpeciesForGeneration, explainEmptyGenerationSelection } from "./lib/selectForGeneration";
import {
  formatIllustrationCustomId,
  type IllustrationPose,
} from "./lib/illustrationCustomId";
import { buildIllustrationPrompt } from "./lib/illustrationPrompt";
import { deleteReplacedStorage } from "./lib/deleteReplacedStorage";

const poseValidator = v.union(v.literal("perch"), v.literal("flight"));

const maskArg = v.object({
  w: v.number(),
  h: v.number(),
  bits: v.string(),
});

function requirePipelineSecret(secret: string): void {
  const expected = process.env.ILLUSTRATION_PIPELINE_SECRET;
  if (!expected || secret !== expected) {
    throw new Error("Unauthorized pipeline request");
  }
}

function convexSiteBase(): string {
  const site = process.env.CONVEX_SITE_URL;
  if (!site) {
    throw new Error("CONVEX_SITE_URL is required for anatomy ref URLs");
  }
  return site.replace(/\/$/, "");
}

/** Status counts for the admin illustration grid (~130 Guide species; bounded). */
export const illustrationStatusSummary = query({
  args: {},
  returns: v.object({
    queued: v.number(),
    generating: v.number(),
    pendingReview: v.number(),
    approved: v.number(),
    failed: v.number(),
    missingAnatomy: v.number(),
    missingFlightAnatomy: v.number(),
  }),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    // eslint-disable-next-line @convex-dev/no-query-collect -- Guide species set is bounded (~130)
    const all = await ctx.db.query("species").collect();
    const summary = {
      queued: 0,
      generating: 0,
      pendingReview: 0,
      approved: 0,
      failed: 0,
      missingAnatomy: 0,
      missingFlightAnatomy: 0,
    };
    for (const sp of all) {
      if (!sp.listed) continue;
      summary[sp.illustrationStatus] += 1;
      if (!sp.anatomyRef) summary.missingAnatomy += 1;
      if (!sp.anatomyRefFlight) summary.missingFlightAnatomy += 1;
    }
    return summary;
  },
});

/** Species awaiting pair review (with anatomy URL when present). */
export const listPendingReview = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("species"),
      slug: v.string(),
      sciName: v.string(),
      comNameEn: v.string(),
      perchUrl: v.optional(v.string()),
      flightUrl: v.optional(v.string()),
      anatomyUrl: v.optional(v.string()),
      anatomyFlightUrl: v.optional(v.string()),
    }),
  ),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const pending = await ctx.db
      .query("species")
      .withIndex("by_illustration_status", (q) =>
        q.eq("illustrationStatus", "pendingReview"),
      )
      .collect();

    const out = [];
    for (const sp of pending) {
      out.push({
        _id: sp._id,
        slug: sp.slug,
        sciName: sp.sciName,
        comNameEn: sp.comNameEn,
        perchUrl: sp.illustrationPerch
          ? ((await ctx.storage.getUrl(sp.illustrationPerch)) ?? undefined)
          : undefined,
        flightUrl: sp.illustrationFlight
          ? ((await ctx.storage.getUrl(sp.illustrationFlight)) ?? undefined)
          : undefined,
        anatomyUrl: sp.anatomyRef
          ? ((await ctx.storage.getUrl(sp.anatomyRef)) ?? undefined)
          : undefined,
        anatomyFlightUrl: sp.anatomyRefFlight
          ? ((await ctx.storage.getUrl(sp.anatomyRefFlight)) ?? undefined)
          : undefined,
      });
    }
    out.sort((a, b) => a.comNameEn.localeCompare(b.comNameEn));
    return out;
  },
});

/**
 * Mark selected species generating and return Gemini edit requests
 * (stable public HTTPS anatomy + style URLs).
 */
export const prepareIllustrationGenerate = mutation({
  args: {
    limit: v.optional(v.number()),
    slugs: v.optional(v.array(v.string())),
    /** Limit to these poses (default both). Used for single-pose regen. */
    poses: v.optional(v.array(poseValidator)),
  },
    returns: v.object({
    requests: v.array(
      v.object({
        customId: v.string(),
        prompt: v.string(),
        images: v.array(v.object({ imageUrl: v.string() })),
        slug: v.string(),
        pose: poseValidator,
        sciName: v.string(),
        comNameEn: v.string(),
      }),
    ),
    skipped: v.array(v.string()),
    emptyReason: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const posesToGenerate: IllustrationPose[] =
      args.poses && args.poses.length > 0
        ? [...new Set(args.poses)]
        : ["perch", "flight"];

    // eslint-disable-next-line @convex-dev/no-query-collect -- Guide species set is bounded (~130)
    const all = await ctx.db.query("species").collect();
    const candidates = all.map((sp) => ({
      slug: sp.slug,
      listed: sp.listed,
      illustrationStatus: sp.illustrationStatus,
      hasAnatomyRef: Boolean(sp.anatomyRef),
      hasFlightAnatomyRef: Boolean(sp.anatomyRefFlight),
      hasCutoutPair: Boolean(sp.illustrationPerch && sp.illustrationFlight),
      _id: sp._id,
      sciName: sp.sciName,
      comNameEn: sp.comNameEn,
      anatomyRef: sp.anatomyRef,
      anatomyRefFlight: sp.anatomyRefFlight,
    }));

    const selected = selectSpeciesForGeneration(candidates, {
      limit: args.limit ?? 20,
      slugs: args.slugs,
    });

    if (selected.length === 0) {
      return {
        requests: [],
        skipped: [],
        emptyReason: explainEmptyGenerationSelection(candidates),
      };
    }

    const convexSite = convexSiteBase();
    // Both refs must be reachable by the image model (not localhost).
    const anatomyUrl = (slug: string, pose: IllustrationPose) =>
      `${convexSite}/refs/anatomy/${pose}/${slug}`;
    const styleUrl = (pose: IllustrationPose) =>
      `${convexSite}/refs/style/${pose}`;

    const stylePerch = await ctx.db
      .query("stylePrints")
      .withIndex("by_key", (q) => q.eq("key", "perch"))
      .unique();
    const styleFlight = await ctx.db
      .query("stylePrints")
      .withIndex("by_key", (q) => q.eq("key", "flight"))
      .unique();
    if (!stylePerch || !styleFlight) {
      throw new Error(
        "Style prints missing. Run: pnpm seed:style-refs (uploads public/refs/style to Convex).",
      );
    }

    const requests: Array<{
      customId: string;
      prompt: string;
      images: Array<{ imageUrl: string }>;
      slug: string;
      pose: IllustrationPose;
      sciName: string;
      comNameEn: string;
    }> = [];
    const skipped: string[] = [];

    for (const c of selected) {
      const sp = candidates.find((x) => x.slug === c.slug);
      // Both pose anatomies required — no flight→perch fallback.
      if (!sp?.anatomyRef || !sp.anatomyRefFlight) {
        skipped.push(c.slug);
        continue;
      }

      // Clear only the poses we are regenerating; keep the other cutout.
      if (posesToGenerate.length === 2) {
        await ctx.db.patch(sp._id, {
          illustrationStatus: "generating",
          illustrationPerch: undefined,
          illustrationFlight: undefined,
          maskPerch: undefined,
          maskFlight: undefined,
          dimsPerch: undefined,
          dimsFlight: undefined,
        });
      } else if (posesToGenerate[0] === "perch") {
        await ctx.db.patch(sp._id, {
          illustrationStatus: "generating",
          illustrationPerch: undefined,
          maskPerch: undefined,
          dimsPerch: undefined,
        });
      } else {
        await ctx.db.patch(sp._id, {
          illustrationStatus: "generating",
          illustrationFlight: undefined,
          maskFlight: undefined,
          dimsFlight: undefined,
        });
      }

      for (const pose of posesToGenerate) {
        requests.push({
          customId: formatIllustrationCustomId(sp.slug, pose),
          prompt: buildIllustrationPrompt({
            sciName: sp.sciName,
            comNameEn: sp.comNameEn,
            pose,
            anatomyPose: pose,
          }),
          images: [
            { imageUrl: anatomyUrl(sp.slug, pose) },
            { imageUrl: styleUrl(pose) },
          ],
          slug: sp.slug,
          pose,
          sciName: sp.sciName,
          comNameEn: sp.comNameEn,
        });
      }
    }

    return { requests, skipped };
  },
});

export const stageIllustrationPose = mutation({
  args: {
    secret: v.string(),
    slug: v.string(),
    pose: poseValidator,
    storageId: v.id("_storage"),
    mask: maskArg,
    dims: v.array(v.number()),
  },
  returns: v.union(
    v.literal("generating"),
    v.literal("pendingReview"),
  ),
  handler: async (ctx, args) => {
    requirePipelineSecret(args.secret);
    const sp = await ctx.db
      .query("species")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (!sp) throw new Error(`Species not found: ${args.slug}`);

    const patch = planStageIllustrationPose({
      pose: args.pose,
      storageId: args.storageId,
      mask: args.mask,
      dims: args.dims,
      existing: {
        illustrationPerch: sp.illustrationPerch,
        illustrationFlight: sp.illustrationFlight,
        maskPerch: sp.maskPerch,
        maskFlight: sp.maskFlight,
        dimsPerch: sp.dimsPerch,
        dimsFlight: sp.dimsFlight,
      },
    });

    if (args.pose === "perch") {
      await deleteReplacedStorage(ctx, sp.illustrationPerch, args.storageId);
      await ctx.db.patch(sp._id, {
        illustrationPerch: args.storageId,
        maskPerch: args.mask,
        dimsPerch: args.dims,
        illustrationStatus: patch.illustrationStatus,
      });
    } else {
      await deleteReplacedStorage(ctx, sp.illustrationFlight, args.storageId);
      await ctx.db.patch(sp._id, {
        illustrationFlight: args.storageId,
        maskFlight: args.mask,
        dimsFlight: args.dims,
        illustrationStatus: patch.illustrationStatus,
      });
    }
    return patch.illustrationStatus;
  },
});

export const failIllustrationPose = mutation({
  args: {
    secret: v.string(),
    slug: v.string(),
    reason: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    requirePipelineSecret(args.secret);
    const sp = await ctx.db
      .query("species")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (!sp) throw new Error(`Species not found: ${args.slug}`);
    console.error("Illustration pose failed", {
      slug: args.slug,
      reason: args.reason,
    });
    await ctx.db.patch(sp._id, planFailIllustrationPose());
    return null;
  },
});

/** Pipeline upload URL (no admin session — secret gated). */
export const generatePipelineUploadUrl = mutation({
  args: { secret: v.string() },
  returns: v.string(),
  handler: async (ctx, args) => {
    requirePipelineSecret(args.secret);
    return await ctx.storage.generateUploadUrl();
  },
});

/** Signed URL for a just-uploaded pipeline image (Workflow download). */
export const getPipelineStorageUrl = mutation({
  args: {
    secret: v.string(),
    storageId: v.id("_storage"),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    requirePipelineSecret(args.secret);
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const attachAnatomyRef = mutation({
  args: {
    speciesId: v.id("species"),
    storageId: v.id("_storage"),
    pose: v.optional(poseValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const sp = await ctx.db.get(args.speciesId);
    if (!sp) throw new Error("Species not found");
    if (args.pose === "flight") {
      await deleteReplacedStorage(ctx, sp.anatomyRefFlight, args.storageId);
      await ctx.db.patch(args.speciesId, { anatomyRefFlight: args.storageId });
    } else {
      await deleteReplacedStorage(ctx, sp.anatomyRef, args.storageId);
      await ctx.db.patch(args.speciesId, { anatomyRef: args.storageId });
    }
    return null;
  },
});

export const upsertStylePrint = mutation({
  args: {
    key: v.string(),
    pose: poseValidator,
    storageId: v.id("_storage"),
  },
  returns: v.id("stylePrints"),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await upsertStylePrintInternal(ctx, args);
  },
});

/** Pipeline-secret upsert so a local script can seed style refs without a browser session. */
export const upsertStylePrintPipeline = mutation({
  args: {
    secret: v.string(),
    key: v.string(),
    pose: poseValidator,
    storageId: v.id("_storage"),
  },
  returns: v.id("stylePrints"),
  handler: async (ctx, args) => {
    requirePipelineSecret(args.secret);
    return await upsertStylePrintInternal(ctx, {
      key: args.key,
      pose: args.pose,
      storageId: args.storageId,
    });
  },
});

async function upsertStylePrintInternal(
  ctx: MutationCtx,
  args: {
    key: string;
    pose: IllustrationPose;
    storageId: import("./_generated/dataModel").Id<"_storage">;
  },
): Promise<import("./_generated/dataModel").Id<"stylePrints">> {
  const existing = await ctx.db
    .query("stylePrints")
    .withIndex("by_key", (q) => q.eq("key", args.key))
    .unique();
  if (existing) {
    await deleteReplacedStorage(ctx, existing.storageId, args.storageId);
    await ctx.db.patch(existing._id, {
      pose: args.pose,
      storageId: args.storageId,
    });
    return existing._id;
  }
  return await ctx.db.insert("stylePrints", {
    key: args.key,
    pose: args.pose,
    storageId: args.storageId,
  });
}

export const getSpeciesForVerify = internalQuery({
  args: { slug: v.string() },
  returns: v.union(
    v.object({
      sciName: v.string(),
      comNameEn: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const sp = await ctx.db
      .query("species")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (!sp) return null;
    return { sciName: sp.sciName, comNameEn: sp.comNameEn };
  },
});

/** Reject pair and clear art so the next generate pass can re-submit.
 * Pass `pose` to clear/regenerate only that cutout; omit to clear both.
 */
export const rejectAndRegenerate = mutation({
  args: {
    speciesId: v.id("species"),
    pose: v.optional(poseValidator),
  },
  returns: v.object({
    slug: v.string(),
    poses: v.array(poseValidator),
  }),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const sp = await ctx.db.get(args.speciesId);
    if (!sp) throw new Error("Species not found");
    const poses: IllustrationPose[] = args.pose
      ? [args.pose]
      : ["perch", "flight"];
    if (args.pose === "perch") {
      await ctx.db.patch(args.speciesId, {
        illustrationStatus: "generating",
        illustrationPerch: undefined,
        maskPerch: undefined,
        dimsPerch: undefined,
      });
    } else if (args.pose === "flight") {
      await ctx.db.patch(args.speciesId, {
        illustrationStatus: "generating",
        illustrationFlight: undefined,
        maskFlight: undefined,
        dimsFlight: undefined,
      });
    } else {
      await ctx.db.patch(args.speciesId, {
        illustrationStatus: "generating",
        illustrationPerch: undefined,
        illustrationFlight: undefined,
        maskPerch: undefined,
        maskFlight: undefined,
        dimsPerch: undefined,
        dimsFlight: undefined,
      });
    }
    return { slug: sp.slug, poses };
  },
});

/**
 * approved/pendingReview without both cutouts → queued.
 * Fixes bogus status so Generate missing can run.
 */
export const resetApprovedWithoutCutouts = mutation({
  args: {},
  returns: v.object({ reset: v.number() }),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await resetApprovedWithoutCutoutsInternal(ctx);
  },
});

export const resetApprovedWithoutCutoutsNow = internalMutation({
  args: {},
  returns: v.object({ reset: v.number() }),
  handler: async (ctx) => {
    return await resetApprovedWithoutCutoutsInternal(ctx);
  },
});

async function resetApprovedWithoutCutoutsInternal(
  ctx: MutationCtx,
): Promise<{ reset: number }> {
  // eslint-disable-next-line @convex-dev/no-query-collect -- bounded Guide set
  const all = await ctx.db.query("species").collect();
  let reset = 0;
  for (const sp of all) {
    const hasPair = Boolean(sp.illustrationPerch && sp.illustrationFlight);
    if (hasPair) continue;
    if (
      sp.illustrationStatus !== "approved" &&
      sp.illustrationStatus !== "pendingReview"
    ) {
      continue;
    }
    await ctx.db.patch(sp._id, { illustrationStatus: "queued" });
    reset += 1;
  }
  return { reset };
}

export const resolveAnatomyStorage = internalQuery({
  args: {
    slug: v.string(),
    pose: v.optional(poseValidator),
  },
  returns: v.union(v.id("_storage"), v.null()),
  handler: async (ctx, args) => {
    const sp = await ctx.db
      .query("species")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (!sp) return null;
    if (args.pose === "flight") {
      return sp.anatomyRefFlight ?? null;
    }
    return sp.anatomyRef ?? null;
  },
});

export const listAnatomyRefsInternal = internalQuery({
  args: {},
  returns: v.array(
    v.object({
      slug: v.string(),
      sciName: v.string(),
      comNameEn: v.string(),
      pose: poseValidator,
      storageId: v.id("_storage"),
    }),
  ),
  handler: async (ctx) => {
    // eslint-disable-next-line @convex-dev/no-query-collect -- Guide species set is bounded
    const all = await ctx.db.query("species").collect();
    const out = [];
    for (const sp of all) {
      if (!sp.listed) continue;
      if (sp.anatomyRef) {
        out.push({
          slug: sp.slug,
          sciName: sp.sciName,
          comNameEn: sp.comNameEn,
          pose: "perch" as const,
          storageId: sp.anatomyRef,
        });
      }
      if (sp.anatomyRefFlight) {
        out.push({
          slug: sp.slug,
          sciName: sp.sciName,
          comNameEn: sp.comNameEn,
          pose: "flight" as const,
          storageId: sp.anatomyRefFlight,
        });
      }
    }
    return out;
  },
});

export const resolveStyleStorage = internalQuery({
  args: { key: v.string() },
  returns: v.union(v.id("_storage"), v.null()),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("stylePrints")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
    return row?.storageId ?? null;
  },
});

export const setAnatomyRefInternal = internalMutation({
  args: {
    slug: v.string(),
    storageId: v.id("_storage"),
    pose: v.optional(poseValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const sp = await ctx.db
      .query("species")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (!sp) throw new Error(`Species not found: ${args.slug}`);
    if (args.pose === "flight") {
      await deleteReplacedStorage(ctx, sp.anatomyRefFlight, args.storageId);
      await ctx.db.patch(sp._id, { anatomyRefFlight: args.storageId });
    } else {
      await deleteReplacedStorage(ctx, sp.anatomyRef, args.storageId);
      await ctx.db.patch(sp._id, { anatomyRef: args.storageId });
    }
    return null;
  },
});
