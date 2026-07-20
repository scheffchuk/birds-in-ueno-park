export type Season = "winter" | "spring" | "summer" | "autumn";

export type SeasonalPrevalence = Record<Season, number>;

export type GuideSpeciesSeed = {
  sciName: string;
  comNameEn: string;
  comNameJa: string;
  comNameZhTw: string;
  slug: string;
  prevalence: SeasonalPrevalence;
};

export type ExistingSpecies = {
  slug: string;
  listed: boolean;
  curatedFields: string[];
  sciName: string;
  comNameEn: string;
  comNameJa: string;
  comNameZhTw: string;
};

export type ExistingPrevalence = Partial<
  Record<Season, { value: number; curated: boolean }>
>;

export type SpeciesUpsertPlan = {
  touchListed: false;
  insert: (GuideSpeciesSeed & {
    listed: true;
    illustrationStatus: "queued";
    curatedFields: [];
  }) | null;
  speciesPatch: Partial<{
    sciName: string;
    comNameEn: string;
    comNameJa: string;
    comNameZhTw: string;
  }>;
  prevalenceUpserts: Array<{ season: Season; value: number }>;
};

const NAME_FIELDS = [
  "sciName",
  "comNameEn",
  "comNameJa",
  "comNameZhTw",
] as const;

export const SEASONS: Season[] = ["winter", "spring", "summer", "autumn"];

/**
 * Pure re-seed plan: skip curatedFields / curated prevalence; never flip Listed.
 */
export function planSpeciesUpsert(args: {
  incoming: GuideSpeciesSeed;
  existing: ExistingSpecies | null;
  existingPrevalence: ExistingPrevalence;
}): SpeciesUpsertPlan {
  const { incoming, existing, existingPrevalence } = args;

  if (!existing) {
    return {
      touchListed: false,
      insert: {
        ...incoming,
        listed: true,
        illustrationStatus: "queued",
        curatedFields: [],
      },
      speciesPatch: {},
      prevalenceUpserts: SEASONS.map((season) => ({
        season,
        value: incoming.prevalence[season],
      })),
    };
  }

  const curated = new Set(existing.curatedFields);
  const speciesPatch: SpeciesUpsertPlan["speciesPatch"] = {};
  for (const field of NAME_FIELDS) {
    if (curated.has(field)) continue;
    if (existing[field] !== incoming[field]) {
      speciesPatch[field] = incoming[field];
    }
  }

  const prevalenceUpserts: SpeciesUpsertPlan["prevalenceUpserts"] = [];
  for (const season of SEASONS) {
    const prev = existingPrevalence[season];
    if (prev?.curated) continue;
    const value = incoming.prevalence[season];
    if (prev?.value === value) continue;
    prevalenceUpserts.push({ season, value });
  }

  return {
    touchListed: false,
    insert: null,
    speciesPatch,
    prevalenceUpserts,
  };
}
