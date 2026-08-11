import { prevalenceForFilter } from "@/lib/collage/prevalence";
import type { SeasonalPrevalence } from "@/lib/collage/types";
import type { SeasonFilter } from "@/lib/season/types";

/** Lean Listed species row from `listAtlas` (card URL already preferred). */
export type AtlasListSource = {
  slug: string;
  sciName: string;
  comNameEn: string;
  comNameJa: string;
  comNameZhTw: string;
  listed: boolean;
  prevalence: SeasonalPrevalence;
  /** Perch art, else flight; omitted when neither exists. */
  imageUrl?: string;
};

export type AtlasListItem = {
  slug: string;
  sciName: string;
  comNameEn: string;
  comNameJa: string;
  comNameZhTw: string;
  /** Prevalence for the selected Season filter (0–100). Used for filter/sort only. */
  prevalence: number;
  /** Perch art, else flight; omitted when neither exists. */
  imageUrl?: string;
};

/**
 * Listed Guide species for the Atlas list — no art gate.
 * Filtered by Season Prevalence > 0; sorted by Prevalence descending.
 */
export function selectForAtlas(
  species: AtlasListSource[],
  filter: SeasonFilter,
): AtlasListItem[] {
  const rows: AtlasListItem[] = [];
  for (const record of species) {
    if (!record.listed) continue;
    const prevalence = prevalenceForFilter(record, filter);
    if (prevalence <= 0) continue;
    rows.push({
      slug: record.slug,
      sciName: record.sciName,
      comNameEn: record.comNameEn,
      comNameJa: record.comNameJa,
      comNameZhTw: record.comNameZhTw,
      prevalence,
      ...(record.imageUrl ? { imageUrl: record.imageUrl } : {}),
    });
  }
  return rows.sort((a, b) => b.prevalence - a.prevalence);
}
