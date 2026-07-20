import type {
  CollageBird,
  SeasonFilter,
  SpeciesRecord,
} from "./types";

function prevalenceForFilter(
  record: SpeciesRecord,
  filter: SeasonFilter,
): number {
  if (filter === "all") {
    return Math.max(
      record.prevalence.winter,
      record.prevalence.spring,
      record.prevalence.summer,
      record.prevalence.autumn,
    );
  }
  return record.prevalence[filter];
}

export function selectForCollage(
  species: SpeciesRecord[],
  filter: SeasonFilter,
): CollageBird[] {
  const selected: CollageBird[] = [];
  for (const record of species) {
    if (!record.listed) continue;
    if (record.illustrationStatus !== "approved") continue;
    const prevalence = prevalenceForFilter(record, filter);
    if (prevalence <= 0) continue;
    selected.push({
      slug: record.slug,
      sciName: record.sciName,
      comNameEn: record.comNameEn,
      comNameJa: record.comNameJa,
      comNameZhTw: record.comNameZhTw,
      prevalence,
    });
  }
  return selected;
}
