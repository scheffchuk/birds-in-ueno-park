import type { CollageBird, CollageSpecies, SeasonFilter } from "./types";
import { collagePose } from "./pose";
import { prevalenceForFilter } from "./prevalence";

/** Birds present in the Season, with their pose resolved. */
export function selectForCollage(
  species: CollageSpecies[],
  filter: SeasonFilter,
): CollageBird[] {
  const selected: CollageBird[] = [];
  for (const record of species) {
    const prevalence = prevalenceForFilter(record, filter);
    if (prevalence <= 0) continue;
    const { url, aspect } = collagePose(record);
    selected.push({
      slug: record.slug,
      sciName: record.sciName,
      comNameEn: record.comNameEn,
      comNameJa: record.comNameJa,
      comNameZhTw: record.comNameZhTw,
      prevalence,
      url,
      aspect,
    });
  }
  return selected;
}
