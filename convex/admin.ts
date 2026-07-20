import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { requireAdmin } from "./lib/auth";
import {
  planAdminCopyEdit,
  planAdminCreateSpecies,
  planAdminNameEdit,
  planAdminPrevalenceEdit,
  planAdminSetListed,
  type Season,
} from "./lib/curation";
import { SEASONS } from "./lib/seedPlan";

const prevalenceValidator = v.object({
  winter: v.number(),
  spring: v.number(),
  summer: v.number(),
  autumn: v.number(),
});

const prevalenceCuratedValidator = v.object({
  winter: v.boolean(),
  spring: v.boolean(),
  summer: v.boolean(),
  autumn: v.boolean(),
});

const adminSpeciesValidator = v.object({
  _id: v.id("species"),
  slug: v.string(),
  sciName: v.string(),
  comNameEn: v.string(),
  comNameJa: v.string(),
  comNameZhTw: v.string(),
  listed: v.boolean(),
  curatedFields: v.array(v.string()),
  illustrationStatus: v.union(
    v.literal("queued"),
    v.literal("generating"),
    v.literal("pendingReview"),
    v.literal("approved"),
    v.literal("failed"),
  ),
  prevalence: prevalenceValidator,
  prevalenceCurated: prevalenceCuratedValidator,
  descriptionEn: v.optional(v.string()),
  descriptionJa: v.optional(v.string()),
  descriptionZhTw: v.optional(v.string()),
  spottingTipsEn: v.optional(v.string()),
  spottingTipsJa: v.optional(v.string()),
  spottingTipsZhTw: v.optional(v.string()),
});

/** Whether the caller is an allowlisted admin (for UI gating). */
export const viewerIsAdmin = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    try {
      await requireAdmin(ctx);
      return true;
    } catch {
      return false;
    }
  },
});

/** All Guide species for admin (includes Unlisted) with provenance. */
export const listSpecies = query({
  args: {},
  returns: v.array(adminSpeciesValidator),
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const all = await ctx.db.query("species").collect();
    const out = [];

    for (const sp of all) {
      const prevalence = {
        winter: 0,
        spring: 0,
        summer: 0,
        autumn: 0,
      };
      const prevalenceCurated = {
        winter: false,
        spring: false,
        summer: false,
        autumn: false,
      };

      for (const season of SEASONS) {
        const row = await ctx.db
          .query("prevalence")
          .withIndex("by_species_and_season", (q) =>
            q.eq("speciesId", sp._id).eq("season", season),
          )
          .unique();
        if (row) {
          prevalence[season] = row.value;
          prevalenceCurated[season] = row.curated;
        }
      }

      out.push({
        _id: sp._id,
        slug: sp.slug,
        sciName: sp.sciName,
        comNameEn: sp.comNameEn,
        comNameJa: sp.comNameJa,
        comNameZhTw: sp.comNameZhTw,
        listed: sp.listed,
        curatedFields: sp.curatedFields,
        illustrationStatus: sp.illustrationStatus,
        prevalence,
        prevalenceCurated,
        descriptionEn: sp.descriptionEn,
        descriptionJa: sp.descriptionJa,
        descriptionZhTw: sp.descriptionZhTw,
        spottingTipsEn: sp.spottingTipsEn,
        spottingTipsJa: sp.spottingTipsJa,
        spottingTipsZhTw: sp.spottingTipsZhTw,
      });
    }

    out.sort((a, b) => a.comNameEn.localeCompare(b.comNameEn));
    return out;
  },
});

export const createSpecies = mutation({
  args: {
    sciName: v.string(),
    comNameEn: v.string(),
    comNameJa: v.string(),
    comNameZhTw: v.string(),
    prevalence: prevalenceValidator,
  },
  returns: v.id("species"),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const plan = planAdminCreateSpecies(args);

    const existing = await ctx.db
      .query("species")
      .withIndex("by_slug", (q) => q.eq("slug", plan.species.slug))
      .unique();
    if (existing) {
      throw new Error(`Species already exists: ${plan.species.slug}`);
    }

    const speciesId = await ctx.db.insert("species", plan.species);
    for (const row of plan.prevalence) {
      await ctx.db.insert("prevalence", {
        speciesId,
        season: row.season,
        value: row.value,
        curated: true,
      });
    }
    return speciesId;
  },
});

export const updateNames = mutation({
  args: {
    speciesId: v.id("species"),
    comNameEn: v.optional(v.string()),
    comNameJa: v.optional(v.string()),
    comNameZhTw: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const sp = await ctx.db.get(args.speciesId);
    if (!sp) throw new Error("Species not found");

    const { speciesPatch } = planAdminNameEdit({
      existing: {
        comNameEn: sp.comNameEn,
        comNameJa: sp.comNameJa,
        comNameZhTw: sp.comNameZhTw,
        curatedFields: sp.curatedFields,
      },
      patch: {
        comNameEn: args.comNameEn,
        comNameJa: args.comNameJa,
        comNameZhTw: args.comNameZhTw,
      },
    });

    if (Object.keys(speciesPatch).length > 0) {
      await ctx.db.patch(args.speciesId, speciesPatch);
    }
    return null;
  },
});

export const updateCopy = mutation({
  args: {
    speciesId: v.id("species"),
    descriptionEn: v.optional(v.string()),
    descriptionJa: v.optional(v.string()),
    descriptionZhTw: v.optional(v.string()),
    spottingTipsEn: v.optional(v.string()),
    spottingTipsJa: v.optional(v.string()),
    spottingTipsZhTw: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const sp = await ctx.db.get(args.speciesId);
    if (!sp) throw new Error("Species not found");

    const { speciesPatch } = planAdminCopyEdit({
      existing: {
        curatedFields: sp.curatedFields,
        descriptionEn: sp.descriptionEn,
        descriptionJa: sp.descriptionJa,
        descriptionZhTw: sp.descriptionZhTw,
        spottingTipsEn: sp.spottingTipsEn,
        spottingTipsJa: sp.spottingTipsJa,
        spottingTipsZhTw: sp.spottingTipsZhTw,
      },
      patch: {
        descriptionEn: args.descriptionEn,
        descriptionJa: args.descriptionJa,
        descriptionZhTw: args.descriptionZhTw,
        spottingTipsEn: args.spottingTipsEn,
        spottingTipsJa: args.spottingTipsJa,
        spottingTipsZhTw: args.spottingTipsZhTw,
      },
    });

    if (Object.keys(speciesPatch).length > 0) {
      await ctx.db.patch(args.speciesId, speciesPatch);
    }
    return null;
  },
});

export const updatePrevalence = mutation({
  args: {
    speciesId: v.id("species"),
    winter: v.optional(v.number()),
    spring: v.optional(v.number()),
    summer: v.optional(v.number()),
    autumn: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const sp = await ctx.db.get(args.speciesId);
    if (!sp) throw new Error("Species not found");

    const existingPrevalence = {
      winter: 0,
      spring: 0,
      summer: 0,
      autumn: 0,
    };
    for (const season of SEASONS) {
      const row = await ctx.db
        .query("prevalence")
        .withIndex("by_species_and_season", (q) =>
          q.eq("speciesId", args.speciesId).eq("season", season),
        )
        .unique();
      if (row) existingPrevalence[season] = row.value;
    }

    const upserts = planAdminPrevalenceEdit({
      existing: existingPrevalence,
      patch: {
        winter: args.winter,
        spring: args.spring,
        summer: args.summer,
        autumn: args.autumn,
      },
    });

    for (const row of upserts) {
      await writeCuratedPrevalence(ctx, args.speciesId, row.season, row.value);
    }
    return null;
  },
});

export const setListed = mutation({
  args: {
    speciesId: v.id("species"),
    listed: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const sp = await ctx.db.get(args.speciesId);
    if (!sp) throw new Error("Species not found");

    const patch = planAdminSetListed(args.listed);
    await ctx.db.patch(args.speciesId, patch);
    return null;
  },
});

async function writeCuratedPrevalence(
  ctx: MutationCtx,
  speciesId: Id<"species">,
  season: Season,
  value: number,
): Promise<void> {
  const prev = await ctx.db
    .query("prevalence")
    .withIndex("by_species_and_season", (q) =>
      q.eq("speciesId", speciesId).eq("season", season),
    )
    .unique();
  if (prev) {
    await ctx.db.patch(prev._id, { value, curated: true });
  } else {
    await ctx.db.insert("prevalence", {
      speciesId,
      season,
      value,
      curated: true,
    });
  }
}
