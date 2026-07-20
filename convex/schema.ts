import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  species: defineTable({
    sciName: v.string(),
    comNameEn: v.string(),
    comNameJa: v.string(),
    comNameZhTw: v.string(),
    descriptionEn: v.optional(v.string()),
    descriptionJa: v.optional(v.string()),
    descriptionZhTw: v.optional(v.string()),
    spottingTipsEn: v.optional(v.string()),
    spottingTipsJa: v.optional(v.string()),
    spottingTipsZhTw: v.optional(v.string()),
    illustrationPerch: v.optional(v.id("_storage")),
    illustrationFlight: v.optional(v.id("_storage")),
    maskPerch: v.optional(
      v.object({ w: v.number(), h: v.number(), bits: v.string() }),
    ),
    maskFlight: v.optional(
      v.object({ w: v.number(), h: v.number(), bits: v.string() }),
    ),
    dimsPerch: v.optional(v.array(v.number())),
    dimsFlight: v.optional(v.array(v.number())),
    illustrationStatus: v.union(
      v.literal("queued"),
      v.literal("generating"),
      v.literal("pendingReview"),
      v.literal("approved"),
      v.literal("failed"),
    ),
    anatomyRef: v.optional(v.id("_storage")),
    slug: v.string(),
    listed: v.boolean(),
    curatedFields: v.array(v.string()),
  })
    .index("by_slug", ["slug"])
    .index("by_listed", ["listed"]),

  prevalence: defineTable({
    speciesId: v.id("species"),
    season: v.union(
      v.literal("winter"),
      v.literal("spring"),
      v.literal("summer"),
      v.literal("autumn"),
    ),
    value: v.number(),
    curated: v.boolean(),
  })
    .index("by_season", ["season"])
    .index("by_species_and_season", ["speciesId", "season"]),
});
