import type { GuideSpeciesSeed } from "./types";

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

/** Review CSV for Guide-species trim checkpoint. */
export function guideSpeciesToReviewCsv(species: GuideSpeciesSeed[]): string {
  const header =
    "sciName,comNameEn,comNameJa,comNameZhTw,winter,spring,summer,autumn";
  const lines = species.map((s) =>
    [
      csvEscape(s.sciName),
      csvEscape(s.comNameEn),
      csvEscape(s.comNameJa),
      csvEscape(s.comNameZhTw),
      s.prevalence.winter,
      s.prevalence.spring,
      s.prevalence.summer,
      s.prevalence.autumn,
    ].join(","),
  );
  return [header, ...lines].join("\n") + "\n";
}
