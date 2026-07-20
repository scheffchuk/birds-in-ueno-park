import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import {
  planSpeciesUpsert,
  SEASONS,
  type ExistingPrevalence,
  type Season,
} from "./lib/seedPlan";
import { loadListedSpecies, loadPrevalenceForSpecies } from "./lib/loadSpecies";

const prevalenceValidator = v.object({
  winter: v.number(),
  spring: v.number(),
  summer: v.number(),
  autumn: v.number(),
});

const guideSpeciesValidator = v.object({
  sciName: v.string(),
  comNameEn: v.string(),
  comNameJa: v.string(),
  comNameZhTw: v.string(),
  slug: v.string(),
  prevalence: prevalenceValidator,
});

const speciesRecordValidator = v.object({
  slug: v.string(),
  sciName: v.string(),
  comNameEn: v.string(),
  comNameJa: v.string(),
  comNameZhTw: v.string(),
  listed: v.boolean(),
  illustrationStatus: v.union(
    v.literal("queued"),
    v.literal("generating"),
    v.literal("pendingReview"),
    v.literal("approved"),
    v.literal("failed"),
  ),
  prevalence: prevalenceValidator,
});

/** Listed Guide species with seasonal Prevalence for the collage. */
export const listForCollage = query({
  args: {},
  returns: v.array(speciesRecordValidator),
  handler: async (ctx) => {
    return await loadListedSpecies(ctx);
  },
});

/**
 * Listed Guide species for the Atlas (includes species awaiting art).
 * Client filters/sorts by Season via selectForAtlas.
 */
export const listAtlas = query({
  args: {},
  returns: v.array(speciesRecordValidator),
  handler: async (ctx) => {
    return await loadListedSpecies(ctx);
  },
});

/** Atlas detail: Listed seeded species only; Unlisted / missing → null. */
export const getSpecies = query({
  args: { slug: v.string() },
  returns: v.union(speciesRecordValidator, v.null()),
  handler: async (ctx, args) => {
    const sp = await ctx.db
      .query("species")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (!sp || !sp.listed) return null;

    const prevalence = await loadPrevalenceForSpecies(ctx, sp._id);

    return {
      slug: sp.slug,
      sciName: sp.sciName,
      comNameEn: sp.comNameEn,
      comNameJa: sp.comNameJa,
      comNameZhTw: sp.comNameZhTw,
      listed: sp.listed,
      illustrationStatus: sp.illustrationStatus,
      prevalence,
    };
  },
});

/**
 * Upsert Guide species + Prevalence from histogram seed.
 * Skips curatedFields / curated prevalence rows; never flips Listed.
 */
export const seedGuideSpecies = internalMutation({
  args: {
    species: v.array(guideSpeciesValidator),
  },
  returns: v.object({
    inserted: v.number(),
    patched: v.number(),
    prevalenceWritten: v.number(),
  }),
  handler: async (ctx, args) => {
    let inserted = 0;
    let patched = 0;
    let prevalenceWritten = 0;

    for (const incoming of args.species) {
      const existing = await ctx.db
        .query("species")
        .withIndex("by_slug", (q) => q.eq("slug", incoming.slug))
        .unique();

      const existingPrevalence: ExistingPrevalence = {};
      if (existing) {
        for (const season of SEASONS) {
          const row = await ctx.db
            .query("prevalence")
            .withIndex("by_species_and_season", (q) =>
              q.eq("speciesId", existing._id).eq("season", season),
            )
            .unique();
          if (row) {
            existingPrevalence[season] = {
              value: row.value,
              curated: row.curated,
            };
          }
        }
      }

      const plan = planSpeciesUpsert({
        incoming,
        existing: existing
          ? {
              slug: existing.slug,
              listed: existing.listed,
              curatedFields: existing.curatedFields,
              sciName: existing.sciName,
              comNameEn: existing.comNameEn,
              comNameJa: existing.comNameJa,
              comNameZhTw: existing.comNameZhTw,
            }
          : null,
        existingPrevalence,
      });

      let speciesId: Id<"species">;

      if (plan.insert) {
        speciesId = await ctx.db.insert("species", {
          sciName: plan.insert.sciName,
          comNameEn: plan.insert.comNameEn,
          comNameJa: plan.insert.comNameJa,
          comNameZhTw: plan.insert.comNameZhTw,
          slug: plan.insert.slug,
          listed: plan.insert.listed,
          curatedFields: [...plan.insert.curatedFields],
          illustrationStatus: plan.insert.illustrationStatus,
        });
        inserted += 1;
      } else if (existing) {
        speciesId = existing._id;
        if (Object.keys(plan.speciesPatch).length > 0) {
          await ctx.db.patch(speciesId, plan.speciesPatch);
          patched += 1;
        }
      } else {
        throw new Error(`Seed plan missing insert for ${incoming.slug}`);
      }

      for (const { season, value } of plan.prevalenceUpserts) {
        await writePrevalence(ctx, speciesId, season, value);
        prevalenceWritten += 1;
      }
    }

    return { inserted, patched, prevalenceWritten };
  },
});

async function writePrevalence(
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
    await ctx.db.patch(prev._id, { value });
  } else {
    await ctx.db.insert("prevalence", {
      speciesId,
      season,
      value,
      curated: false,
    });
  }
}
