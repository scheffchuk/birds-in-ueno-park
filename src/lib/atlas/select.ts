import type {
  SeasonFilter,
  SpeciesRecord,
} from "@/lib/collage/types";
import { prevalenceForFilter } from "@/lib/collage/prevalence";

export type AtlasListItem = {
  slug: string;
  sciName: string;
  comNameEn: string;
  comNameJa: string;
  comNameZhTw: string;
  /** Prevalence for the selected Season filter (0–100). */
  prevalence: number;
};

/**
 * Listed Guide species for the Atlas list — no art gate.
 * Filtered by Season Prevalence > 0; sorted by Prevalence descending.
 */
export function selectForAtlas(
  species: SpeciesRecord[],
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
    });
  }
  return rows.sort((a, b) => b.prevalence - a.prevalence);
}
