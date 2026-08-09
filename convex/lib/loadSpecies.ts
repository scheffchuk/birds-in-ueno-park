import type { QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import { SEASONS, type SeasonalPrevalence } from "./seedPlan";

export type MaskBits = { w: number; h: number; bits: string };

export type ListedSpeciesRecord = {
  slug: string;
  sciName: string;
  comNameEn: string;
  comNameJa: string;
  comNameZhTw: string;
  listed: true;
  illustrationStatus:
    | "queued"
    | "generating"
    | "pendingReview"
    | "approved"
    | "failed";
  prevalence: SeasonalPrevalence;
  descriptionEn?: string;
  descriptionJa?: string;
  descriptionZhTw?: string;
  spottingTipsEn?: string;
  spottingTipsJa?: string;
  spottingTipsZhTw?: string;
  perchUrl?: string;
  flightUrl?: string;
};

/** Lean Listed row for the Atlas list page (one card URL). */
export type AtlasListSpeciesRecord = {
  slug: string;
  sciName: string;
  comNameEn: string;
  comNameJa: string;
  comNameZhTw: string;
  listed: true;
  prevalence: SeasonalPrevalence;
  imageUrl?: string;
};

/**
 * Collage row: approved art with one cutout (perch preferred). Masks stay
 * server-side — the collage packs by bounding box.
 */
export type CollageSpeciesRecord = {
  slug: string;
  sciName: string;
  comNameEn: string;
  comNameJa: string;
  comNameZhTw: string;
  prevalence: SeasonalPrevalence;
  url: string;
  aspect: number;
};

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

function baseListedFields(sp: Doc<"species">): Omit<
  ListedSpeciesRecord,
  "prevalence" | "perchUrl" | "flightUrl"
> {
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

export async function loadListedSpecies(
  ctx: QueryCtx,
): Promise<ListedSpeciesRecord[]> {
  const listed = await ctx.db
    .query("species")
    .withIndex("by_listed", (q) => q.eq("listed", true))
    .collect();

  const out: ListedSpeciesRecord[] = [];
  for (const sp of listed) {
    out.push({
      ...baseListedFields(sp),
      prevalence: await loadPrevalenceForSpecies(ctx, sp._id),
      ...(await resolveIllustrationUrls(ctx, sp)),
    });
  }
  return out;
}

/** Listed Guide species for Atlas list — one card URL, no copy fields. */
export async function loadAtlasListSpecies(
  ctx: QueryCtx,
): Promise<AtlasListSpeciesRecord[]> {
  const listed = await ctx.db
    .query("species")
    .withIndex("by_listed", (q) => q.eq("listed", true))
    .collect();

  const out: AtlasListSpeciesRecord[] = [];
  for (const sp of listed) {
    const imageUrl = await resolveCardIllustrationUrl(ctx, sp);
    out.push({
      slug: sp.slug,
      sciName: sp.sciName,
      comNameEn: sp.comNameEn,
      comNameJa: sp.comNameJa,
      comNameZhTw: sp.comNameZhTw,
      listed: true,
      prevalence: await loadPrevalenceForSpecies(ctx, sp._id),
      ...(imageUrl ? { imageUrl } : {}),
    });
  }
  return out;
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
export async function loadSpeciesForCollage(
  ctx: QueryCtx,
): Promise<CollageSpeciesRecord[]> {
  const listed = await ctx.db
    .query("species")
    .withIndex("by_listed", (q) => q.eq("listed", true))
    .collect();

  const out: CollageSpeciesRecord[] = [];
  for (const sp of listed) {
    if (sp.illustrationStatus !== "approved") continue;
    const { perchUrl, flightUrl } = await resolveIllustrationUrls(ctx, sp);
    const url = perchUrl ?? flightUrl;
    if (!url) continue;

    out.push({
      slug: sp.slug,
      sciName: sp.sciName,
      comNameEn: sp.comNameEn,
      comNameJa: sp.comNameJa,
      comNameZhTw: sp.comNameZhTw,
      prevalence: await loadPrevalenceForSpecies(ctx, sp._id),
      url,
      aspect: aspectFromDims(perchUrl ? sp.dimsPerch : sp.dimsFlight),
    });
  }
  return out;
}
