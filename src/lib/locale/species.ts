import type { AppLocale } from "@/i18n/routing";

export type SpeciesNames = {
  comNameEn: string;
  comNameJa: string;
  comNameZhTw: string;
};

export type SpeciesNameStack = SpeciesNames & {
  sciName: string;
};

type LongFormKind = "description" | "spottingTips";

type LongFormFields = {
  descriptionEn?: string;
  descriptionJa?: string;
  descriptionZhTw?: string;
  spottingTipsEn?: string;
  spottingTipsJa?: string;
  spottingTipsZhTw?: string;
};

function hasText(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function commonNameForLocale(
  names: SpeciesNames,
  locale: AppLocale,
): string {
  switch (locale) {
    case "ja":
      return names.comNameJa;
    case "zh-tw":
      return names.comNameZhTw;
    case "en":
      return names.comNameEn;
  }
}

function longFormField(
  fields: LongFormFields,
  kind: LongFormKind,
  locale: AppLocale,
): string | undefined {
  if (kind === "description") {
    switch (locale) {
      case "ja":
        return fields.descriptionJa;
      case "zh-tw":
        return fields.descriptionZhTw;
      case "en":
        return fields.descriptionEn;
    }
  }
  switch (locale) {
    case "ja":
      return fields.spottingTipsJa;
    case "zh-tw":
      return fields.spottingTipsZhTw;
    case "en":
      return fields.spottingTipsEn;
  }
}

/** Locale prose with EN-only fallback — never a third Locale. */
export function longFormForLocale(
  fields: LongFormFields,
  kind: LongFormKind,
  locale: AppLocale,
): string | undefined {
  const primary = longFormField(fields, kind, locale);
  if (hasText(primary)) return primary.trim();
  if (locale === "en") return undefined;
  const en = longFormField(fields, kind, "en");
  return hasText(en) ? en.trim() : undefined;
}

export type NameStack = {
  primary: string;
  secondary: string[];
  scientific: string;
};

/** Detail header: Locale h1, other commons (EN first when Locale ≠ EN), sciName. */
export function nameStackForLocale(
  species: SpeciesNameStack,
  locale: AppLocale,
): NameStack {
  const primary = commonNameForLocale(species, locale);
  const all: { locale: AppLocale; name: string }[] = [
    { locale: "en", name: species.comNameEn },
    { locale: "ja", name: species.comNameJa },
    { locale: "zh-tw", name: species.comNameZhTw },
  ];
  const rest = all.filter((entry) => entry.locale !== locale);
  if (locale !== "en") {
    rest.sort((a, b) => {
      if (a.locale === "en") return -1;
      if (b.locale === "en") return 1;
      return 0;
    });
  }
  return {
    primary,
    secondary: rest.map((entry) => entry.name),
    scientific: species.sciName,
  };
}
