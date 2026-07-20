import type { WeeklyHistogram } from "./parse";

/** Merge histogram sets by scientific name; per week take the max frequency. */
export function mergeHistogramsMax(
  ...sources: WeeklyHistogram[][]
): WeeklyHistogram[] {
  const bySci = new Map<string, WeeklyHistogram>();
  for (const source of sources) {
    for (const row of source) {
      const existing = bySci.get(row.sciName);
      if (!existing) {
        bySci.set(row.sciName, {
          sciName: row.sciName,
          comNameEn: row.comNameEn,
          weeks: [...row.weeks],
        });
        continue;
      }
      for (let i = 0; i < 48; i++) {
        existing.weeks[i] = Math.max(existing.weeks[i] ?? 0, row.weeks[i] ?? 0);
      }
    }
  }
  return [...bySci.values()].sort((a, b) => a.sciName.localeCompare(b.sciName));
}
