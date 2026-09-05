import type { XenoCantoRecording } from "./types";

const MAX_PREFERRED_DURATION_SECONDS = 90;

const LICENSES = [
  { pattern: /(?:^|\/)zero(?:\/|$)|\bcc0\b|public domain/i, name: "CC0" },
  { pattern: /\/licenses\/by-nc-nd(?:\/|$)|\bcc by-nc-nd\b/i, name: "CC BY-NC-ND" },
  { pattern: /\/licenses\/by-nc-sa(?:\/|$)|\bcc by-nc-sa\b/i, name: "CC BY-NC-SA" },
  { pattern: /\/licenses\/by-nc(?:\/|$)|\bcc by-nc\b/i, name: "CC BY-NC" },
  { pattern: /\/licenses\/by-sa(?:\/|$)|\bcc by-sa\b/i, name: "CC BY-SA" },
  { pattern: /\/licenses\/by(?:\/|$)|\bcc by\b/i, name: "CC BY" },
] as const;

export type EligibleRecording = {
  recording: XenoCantoRecording;
  durationSeconds: number;
  licenseUrl: string;
  license: (typeof LICENSES)[number]["name"];
  nonCommercial: boolean;
};

export function normalizeScientificName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function recordingScientificName(recording: XenoCantoRecording): string {
  if (recording.scientificName) return recording.scientificName;
  return [recording.gen, recording.sp].filter(Boolean).join(" ");
}

export function parseDurationSeconds(value: string | number | undefined): number | undefined {
  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 0 ? value : undefined;
  }
  if (typeof value !== "string" || value.trim() === "") return undefined;

  const trimmed = value.trim();
  if (/^\d+(?:\.\d+)?$/.test(trimmed)) return Number(trimmed);
  const parts = trimmed.split(":").map(Number);
  if (parts.some((part) => !Number.isFinite(part) || part < 0)) return undefined;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return undefined;
}

function durationOf(recording: XenoCantoRecording): number | undefined {
  return parseDurationSeconds(recording.duration ?? recording.length);
}

function licenseOf(recording: XenoCantoRecording) {
  const licenseUrl =
    recording.licenceUrl ??
    recording.licenseUrl ??
    recording.lic ??
    recording.licence ??
    recording.license;
  if (!licenseUrl) return undefined;
  const license = LICENSES.find(({ pattern }) => pattern.test(licenseUrl));
  if (!license) return undefined;
  return {
    licenseUrl,
    license: license.name,
    nonCommercial: license.name.includes("NC"),
  };
}

function isQuestionable(recording: XenoCantoRecording): boolean {
  const searchable = [
    recording.type,
    recording.remarks,
    recording.rmk,
    recording["bird-seen"],
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase();
  return /background|uncertain|questionable|unknown|not sure|possibly|probable/.test(
    searchable,
  );
}

export function eligibleRecordings(
  scientificName: string,
  recordings: readonly XenoCantoRecording[],
): EligibleRecording[] {
  const expected = normalizeScientificName(scientificName);
  const eligible: EligibleRecording[] = [];
  for (const recording of recordings) {
    if (normalizeScientificName(recordingScientificName(recording)) !== expected) continue;
    if (!recording.url && !recording.file) continue;
    if (!recording.rec?.trim()) continue;
    if (isQuestionable(recording)) continue;
    const durationSeconds = durationOf(recording);
    if (durationSeconds === undefined) continue;
    const license = licenseOf(recording);
    if (!license) continue;
    eligible.push({
      recording,
      durationSeconds,
      ...license,
    });
  }
  return eligible;
}

function soundTypeRank(type: string | undefined): number {
  const normalized = type?.toLocaleLowerCase() ?? "";
  if (normalized.includes("song")) return 0;
  if (normalized.includes("call")) return 1;
  return 2;
}

function qualityRank(quality: string | undefined): number {
  const letter = quality?.trim().toLocaleUpperCase();
  if (!letter) return 9;
  const rank = "ABCDE".indexOf(letter[0] ?? "");
  return rank >= 0 ? rank : 9;
}

function catalogueRank(id: string | number): [number, string] {
  const text = String(id);
  const numeric = Number(text);
  return [Number.isFinite(numeric) ? numeric : Number.MAX_SAFE_INTEGER, text];
}

function compareRecordings(
  a: EligibleRecording,
  b: EligibleRecording,
  shortestFirst: boolean,
): number {
  if (shortestFirst && a.durationSeconds !== b.durationSeconds) {
    return a.durationSeconds - b.durationSeconds;
  }

  const typeDifference =
    soundTypeRank(a.recording.type) - soundTypeRank(b.recording.type);
  if (typeDifference !== 0) return typeDifference;

  if (!shortestFirst && a.durationSeconds !== b.durationSeconds) {
    return a.durationSeconds - b.durationSeconds;
  }

  const qualityDifference =
    qualityRank(a.recording.q) - qualityRank(b.recording.q);
  if (qualityDifference !== 0) return qualityDifference;

  const [aNumber, aText] = catalogueRank(a.recording.id);
  const [bNumber, bText] = catalogueRank(b.recording.id);
  return aNumber - bNumber || aText.localeCompare(bText);
}

/** Select one deterministic, defensible recording from an exact-name result set. */
export function selectRecording(
  scientificName: string,
  recordings: readonly XenoCantoRecording[],
): EligibleRecording | undefined {
  const eligible = eligibleRecordings(scientificName, recordings);
  if (eligible.length === 0) return undefined;

  const preferredDuration = eligible.filter(
    ({ durationSeconds }) => durationSeconds <= MAX_PREFERRED_DURATION_SECONDS,
  );
  const pool = preferredDuration.length > 0 ? preferredDuration : eligible;
  return [...pool].sort((a, b) =>
    compareRecordings(a, b, preferredDuration.length === 0),
  )[0];
}

export function sourceUrlFor(recording: XenoCantoRecording): string {
  return recording.file || recording.url || "";
}

/** Human-facing xeno-canto catalogue page retained as provenance. */
export function catalogueUrlFor(recording: XenoCantoRecording): string {
  return `https://xeno-canto.org/${encodeURIComponent(String(recording.id))}`;
}
