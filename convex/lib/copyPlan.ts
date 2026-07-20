export const COPY_FIELDS = [
  "descriptionEn",
  "descriptionJa",
  "descriptionZhTw",
  "spottingTipsEn",
  "spottingTipsJa",
  "spottingTipsZhTw",
] as const;

export type CopyField = (typeof COPY_FIELDS)[number];

export type SpeciesCopy = Record<CopyField, string>;

export type ExistingCopy = {
  curatedFields: string[];
} & Partial<Record<CopyField, string | undefined>>;

export type CopyUpsertPlan = {
  speciesPatch: Partial<Record<CopyField, string>>;
};

/**
 * Pure copy re-seed plan: skip fields listed in curatedFields.
 * Does not touch Listed or name fields.
 */
export function planCopyUpsert(args: {
  incoming: SpeciesCopy;
  existing: ExistingCopy;
}): CopyUpsertPlan {
  const curated = new Set(args.existing.curatedFields);
  const speciesPatch: CopyUpsertPlan["speciesPatch"] = {};

  for (const field of COPY_FIELDS) {
    if (curated.has(field)) continue;
    const next = args.incoming[field];
    if (args.existing[field] === next) continue;
    speciesPatch[field] = next;
  }

  return { speciesPatch };
}
