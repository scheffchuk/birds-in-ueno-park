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
    .index("by_listed", ["listed"])
    .index("by_illustration_status", ["illustrationStatus"]),

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

  /** Style-print refs served at /refs/style/:key (public HTTPS for Batchwork). */
  stylePrints: defineTable({
    key: v.string(),
    pose: v.union(v.literal("perch"), v.literal("flight")),
    storageId: v.id("_storage"),
  })
    .index("by_key", ["key"])
    .index("by_pose", ["pose"]),

  /** Open Batchwork jobs awaiting cron poll → pose workflows. */
  illustrationBatches: defineTable({
    provider: v.string(),
    batchId: v.string(),
    status: v.union(
      v.literal("open"),
      v.literal("delivered"),
      v.literal("failed"),
    ),
    createdAt: v.number(),
    requests: v.array(
      v.object({
        customId: v.string(),
        slug: v.string(),
        pose: v.union(v.literal("perch"), v.literal("flight")),
        sciName: v.string(),
        comNameEn: v.string(),
      }),
    ),
  })
    .index("by_status", ["status"])
    .index("by_batch", ["provider", "batchId"]),
});
