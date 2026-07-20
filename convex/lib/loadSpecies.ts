import type { QueryCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { SEASONS, type SeasonalPrevalence } from "./seedPlan";

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
      slug: sp.slug,
      sciName: sp.sciName,
      comNameEn: sp.comNameEn,
      comNameJa: sp.comNameJa,
      comNameZhTw: sp.comNameZhTw,
      listed: true,
      illustrationStatus: sp.illustrationStatus,
      prevalence: await loadPrevalenceForSpecies(ctx, sp._id),
    });
  }
  return out;
}
