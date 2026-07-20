import { COPY_FIELDS, type CopyField } from "./copyPlan";
import { slugFromSciName } from "./slug";

export type Season = "winter" | "spring" | "summer" | "autumn";

export type SeasonalPrevalence = Record<Season, number>;

const SEASONS: Season[] = ["winter", "spring", "summer", "autumn"];

const NAME_FIELDS = ["comNameEn", "comNameJa", "comNameZhTw"] as const;

export type NameField = (typeof NAME_FIELDS)[number];

export type AdminCreateInput = {
  sciName: string;
  comNameEn: string;
  comNameJa: string;
  comNameZhTw: string;
  prevalence: SeasonalPrevalence;
};

export type AdminCreatePlan = {
  species: {
    sciName: string;
    comNameEn: string;
    comNameJa: string;
    comNameZhTw: string;
    slug: string;
    listed: true;
    curatedFields: string[];
    illustrationStatus: "queued";
  };
  prevalence: Array<{ season: Season; value: number; curated: true }>;
};

/** New Guide species: Slug from sciName once; all editable fields curated. */
export function planAdminCreateSpecies(
  input: AdminCreateInput,
): AdminCreatePlan {
  return {
    species: {
      sciName: input.sciName,
      comNameEn: input.comNameEn,
      comNameJa: input.comNameJa,
      comNameZhTw: input.comNameZhTw,
      slug: slugFromSciName(input.sciName),
      listed: true,
      curatedFields: ["sciName", "comNameEn", "comNameJa", "comNameZhTw"],
      illustrationStatus: "queued",
    },
    prevalence: SEASONS.map((season) => ({
      season,
      value: input.prevalence[season],
      curated: true as const,
    })),
  };
}

export type AdminNameEditInput = {
  existing: {
    comNameEn: string;
    comNameJa: string;
    comNameZhTw: string;
    curatedFields: string[];
  };
  patch: Partial<Record<NameField, string>>;
};

export type AdminNameEditPlan = {
  speciesPatch: Partial<{
    comNameEn: string;
    comNameJa: string;
    comNameZhTw: string;
    curatedFields: string[];
  }>;
};

/** Hand-edit common names; append changed field names to curatedFields. */
export function planAdminNameEdit(
  args: AdminNameEditInput,
): AdminNameEditPlan {
  const curated = new Set(args.existing.curatedFields);
  const speciesPatch: AdminNameEditPlan["speciesPatch"] = {};
  let touched = false;

  for (const field of NAME_FIELDS) {
    const next = args.patch[field];
    if (next === undefined) continue;
    if (next === args.existing[field]) continue;
    speciesPatch[field] = next;
    curated.add(field);
    touched = true;
  }

  if (!touched) return { speciesPatch: {} };

  speciesPatch.curatedFields = [...curated];
  return { speciesPatch };
}

/** Hand-edit Prevalence; only changed seasons become curated. */
export function planAdminPrevalenceEdit(args: {
  existing: SeasonalPrevalence | null;
  patch: Partial<Record<Season, number>>;
}): Array<{ season: Season; value: number; curated: true }> {
  const out: Array<{ season: Season; value: number; curated: true }> = [];
  for (const season of SEASONS) {
    const value = args.patch[season];
    if (value === undefined) continue;
    if (args.existing && args.existing[season] === value) continue;
    out.push({ season, value, curated: true });
  }
  return out;
}

/** Soft-hide / restore via Listed only. */
export function planAdminSetListed(listed: boolean): { listed: boolean } {
  return { listed };
}

export type AdminCopyEditInput = {
  existing: {
    curatedFields: string[];
  } & Partial<Record<CopyField, string | undefined>>;
  patch: Partial<Record<CopyField, string>>;
};

export type AdminCopyEditPlan = {
  speciesPatch: Partial<Record<CopyField, string>> & {
    curatedFields?: string[];
  };
};

/** Hand-edit description / spotting tips; append changed fields to curatedFields. */
export function planAdminCopyEdit(
  args: AdminCopyEditInput,
): AdminCopyEditPlan {
  const curated = new Set(args.existing.curatedFields);
  const speciesPatch: AdminCopyEditPlan["speciesPatch"] = {};
  let touched = false;

  for (const field of COPY_FIELDS) {
    const next = args.patch[field];
    if (next === undefined) continue;
    if (next === args.existing[field]) continue;
    speciesPatch[field] = next;
    curated.add(field);
    touched = true;
  }

  if (!touched) return { speciesPatch: {} };

  speciesPatch.curatedFields = [...curated];
  return { speciesPatch };
}
