import type { QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import { SEASONS, type SeasonalPrevalence } from "./seedPlan";

export async function loadPrevalenceForSpecies(
  ctx: QueryCtx,
  speciesId: Id<"species">,
): Promise<SeasonalPrevalence> {
  const prevalence: SeasonalPrevalence = {
    winter: 0,
    spring: 0,
    summer: 0,
    autumn: 0,
  };
  for (const season of SEASONS) {
    const row = await ctx.db
      .query("prevalence")
      .withIndex("by_species_and_season", (q) =>
        q.eq("speciesId", speciesId).eq("season", season),
      )
      .unique();
    if (row) prevalence[season] = row.value;
  }
  return prevalence;
}

function baseListedFields(sp: Doc<"species">) {
  return {
    slug: sp.slug,
    sciName: sp.sciName,
    comNameEn: sp.comNameEn,
    comNameJa: sp.comNameJa,
    comNameZhTw: sp.comNameZhTw,
    listed: true,
    illustrationStatus: sp.illustrationStatus,
    descriptionEn: sp.descriptionEn,
    descriptionJa: sp.descriptionJa,
    descriptionZhTw: sp.descriptionZhTw,
    spottingTipsEn: sp.spottingTipsEn,
    spottingTipsJa: sp.spottingTipsJa,
    spottingTipsZhTw: sp.spottingTipsZhTw,
  };
}

async function resolveIllustrationUrls(
  ctx: QueryCtx,
  sp: Doc<"species">,
): Promise<{ perchUrl?: string; flightUrl?: string }> {
  const perchUrl = sp.illustrationPerch
    ? ((await ctx.storage.getUrl(sp.illustrationPerch)) ?? undefined)
    : undefined;
  const flightUrl = sp.illustrationFlight
    ? ((await ctx.storage.getUrl(sp.illustrationFlight)) ?? undefined)
    : undefined;
  return {
    ...(perchUrl ? { perchUrl } : {}),
    ...(flightUrl ? { flightUrl } : {}),
  };
}

/** Prefer perch; only resolve flight when perch is missing. */
async function resolveCardIllustrationUrl(
  ctx: QueryCtx,
  sp: Doc<"species">,
): Promise<string | undefined> {
  if (sp.illustrationPerch) {
    return (await ctx.storage.getUrl(sp.illustrationPerch)) ?? undefined;
  }
  if (sp.illustrationFlight) {
    return (await ctx.storage.getUrl(sp.illustrationFlight)) ?? undefined;
  }
  return undefined;
}

export async function loadListedSpecies(ctx: QueryCtx) {
  const listed = await ctx.db
    .query("species")
    .withIndex("by_listed", (q) => q.eq("listed", true))
    .collect();

  return await Promise.all(
    listed.map(async (sp) => ({
      ...baseListedFields(sp),
      prevalence: await loadPrevalenceForSpecies(ctx, sp._id),
      ...(await resolveIllustrationUrls(ctx, sp)),
    })),
  );
}

/** Listed Guide species for Atlas list — one card URL, no copy fields. */
export async function loadAtlasListSpecies(ctx: QueryCtx) {
  const listed = await ctx.db
    .query("species")
    .withIndex("by_listed", (q) => q.eq("listed", true))
    .collect();

  return await Promise.all(
    listed.map(async (sp) => {
      const imageUrl = await resolveCardIllustrationUrl(ctx, sp);
      return {
        slug: sp.slug,
        sciName: sp.sciName,
        comNameEn: sp.comNameEn,
        comNameJa: sp.comNameJa,
        comNameZhTw: sp.comNameZhTw,
        listed: true,
        prevalence: await loadPrevalenceForSpecies(ctx, sp._id),
        ...(imageUrl ? { imageUrl } : {}),
      };
    }),
  );
}

/** Fallback shape for art attached before dims were recorded. */
const DEFAULT_ASPECT = 1.4;

function aspectFromDims(dims: number[] | undefined): number {
  const w = dims?.[0];
  const h = dims?.[1];
  if (
    typeof w === "number" &&
    typeof h === "number" &&
    Number.isFinite(w) &&
    Number.isFinite(h) &&
    w > 0 &&
    h > 0
  ) {
    return w / h;
  }
  return DEFAULT_ASPECT;
}

/** Listed species ready for the collage — approved, at least one cutout. */
export async function loadSpeciesForCollage(ctx: QueryCtx) {
  const listed = await ctx.db
    .query("species")
    .withIndex("by_listed", (q) => q.eq("listed", true))
    .collect();

  const rows = await Promise.all(
    listed.map(async (sp) => {
      if (sp.illustrationStatus !== "approved") return null;
      const { perchUrl, flightUrl } = await resolveIllustrationUrls(ctx, sp);
      const url = perchUrl ?? flightUrl;
      if (!url) return null;
      return {
        slug: sp.slug,
        sciName: sp.sciName,
        comNameEn: sp.comNameEn,
        comNameJa: sp.comNameJa,
        comNameZhTw: sp.comNameZhTw,
        prevalence: await loadPrevalenceForSpecies(ctx, sp._id),
        url,
        aspect: aspectFromDims(perchUrl ? sp.dimsPerch : sp.dimsFlight),
      };
    }),
  );
  return rows.filter((row) => row !== null);
}
