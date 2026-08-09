import type { CollageBird, CollageSpecies, SeasonFilter } from "./types";
import { prevalenceForFilter } from "./prevalence";

/** Birds present in the Season — URL/aspect already resolved on the row. */
export function selectForCollage(
  species: CollageSpecies[],
  filter: SeasonFilter,
): CollageBird[] {
  const selected: CollageBird[] = [];
  for (const record of species) {
    const prevalence = prevalenceForFilter(record, filter);
    if (prevalence <= 0) continue;
    selected.push({
      slug: record.slug,
      sciName: record.sciName,
      comNameEn: record.comNameEn,
      comNameJa: record.comNameJa,
      comNameZhTw: record.comNameZhTw,
      prevalence,
      url: record.url,
      aspect: record.aspect,
    });
  }
  return selected;
}
