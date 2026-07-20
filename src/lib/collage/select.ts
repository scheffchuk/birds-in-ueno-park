import type {
  CollageBird,
  SeasonFilter,
  SpeciesRecord,
} from "./types";
import { prevalenceForFilter } from "./prevalence";

export function selectForCollage(
  species: SpeciesRecord[],
  filter: SeasonFilter,
): CollageBird[] {
  const selected: CollageBird[] = [];
  for (const record of species) {
    if (!record.listed) continue;
    if (record.illustrationStatus !== "approved") continue;
    if (!record.perchUrl || !record.flightUrl) continue;
    const prevalence = prevalenceForFilter(record, filter);
    if (prevalence <= 0) continue;
    selected.push({
      slug: record.slug,
      sciName: record.sciName,
      comNameEn: record.comNameEn,
      comNameJa: record.comNameJa,
      comNameZhTw: record.comNameZhTw,
      prevalence,
      perchUrl: record.perchUrl,
      flightUrl: record.flightUrl,
      dimsPerch: record.dimsPerch,
      dimsFlight: record.dimsFlight,
      maskPerch: record.maskPerch,
      maskFlight: record.maskFlight,
    });
  }
  return selected;
}
