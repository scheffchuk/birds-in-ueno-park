export type WeeklyHistogram = {
  sciName: string;
  comNameEn: string;
  weeks: number[];
};

/** Extract "Common Name (Genus species)" or bare scientific name. */
function parseSpeciesLabel(label: string): { sciName: string; comNameEn: string } {
  const trimmed = label.trim();
  const paren = trimmed.match(/^(.*)\s+\(([A-Z][a-z]+(?:\s+[a-z]+)+)\)$/);
  if (paren?.[1] && paren[2]) {
    return { comNameEn: paren[1].trim(), sciName: paren[2] };
  }
  if (/^[A-Z][a-z]+(?:\s+[a-z]+)+$/.test(trimmed)) {
    return { sciName: trimmed, comNameEn: trimmed };
  }
  throw new Error(`Unrecognized species label: ${label}`);
}

/**
 * Parse an eBird histogram TSV (Download Histogram Data format).
 * Frequencies are detection proportions in [0, 1] for 48 month-weeks.
 */
export function parseHistogramTsv(text: string): WeeklyHistogram[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  const sampleIdx = lines.findIndex((l) => l.startsWith("Sample Size:"));
  if (sampleIdx < 0) {
    throw new Error("Histogram TSV missing Sample Size row");
  }

  const rows: WeeklyHistogram[] = [];
  for (const line of lines.slice(sampleIdx + 1)) {
    const cols = line.split("\t");
    const label = cols[0]?.trim();
    if (!label) continue;
    const weekCols = cols.slice(1, 49);
    if (weekCols.length < 48) {
      throw new Error(`Expected 48 week columns for ${label}, got ${weekCols.length}`);
    }
    const weeks = weekCols.map((c) => {
      const n = Number(c);
      if (!Number.isFinite(n)) {
        throw new Error(`Non-numeric frequency for ${label}: ${c}`);
      }
      return n;
    });
    const { sciName, comNameEn } = parseSpeciesLabel(label);
    rows.push({ sciName, comNameEn, weeks });
  }
  return rows;
}
