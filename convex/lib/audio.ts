import { v } from "convex/values";

export const speciesAudioValidator = v.object({
  status: v.union(v.literal("available"), v.literal("unavailable")),
  storageId: v.optional(v.id("_storage")),
  sourceUrl: v.optional(v.string()),
  catalogueNumber: v.optional(v.string()),
  recordist: v.optional(v.string()),
  licenseUrl: v.optional(v.string()),
  license: v.optional(v.string()),
  nonCommercial: v.optional(v.boolean()),
  durationSeconds: v.optional(v.number()),
  sha256: v.optional(v.string()),
  bytes: v.optional(v.number()),
  contentType: v.optional(v.string()),
  unavailableReason: v.optional(v.string()),
});

export const speciesEbirdValidator = v.object({
  speciesCode: v.string(),
  url: v.string(),
});

export const speciesWikipediaValidator = v.object({
  en: v.string(),
  ja: v.string(),
  zhTw: v.string(),
});

export const publicAudioValidator = v.object({
  status: v.union(v.literal("available"), v.literal("unavailable")),
  url: v.optional(v.string()),
  sourceUrl: v.optional(v.string()),
  catalogueNumber: v.optional(v.string()),
  recordist: v.optional(v.string()),
  licenseUrl: v.optional(v.string()),
  license: v.optional(v.string()),
  nonCommercial: v.optional(v.boolean()),
  durationSeconds: v.optional(v.number()),
  sha256: v.optional(v.string()),
  bytes: v.optional(v.number()),
  contentType: v.optional(v.string()),
  unavailableReason: v.optional(v.string()),
});
