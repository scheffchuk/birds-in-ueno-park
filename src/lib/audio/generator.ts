import {
  catalogueUrlFor,
  normalizeScientificName,
  selectRecording,
  sourceUrlFor,
} from "./select";
import { ebirdSpeciesUrl } from "../atlas/ebird";
import type {
  AudioManifest,
  AudioManifestEntry,
  AudioManifestAvailable,
  DownloadedAudio,
  EbirdTaxon,
  GuideSpeciesForAudio,
  WikipediaTaxon,
  XenoCantoRecording,
} from "./types";

export type StoredAudio = {
  file: string;
  sha256: string;
  bytes: number;
  contentType?: string;
};

export type AudioGeneratorAdapters = {
  searchXenoCanto: (
    scientificName: string,
  ) => Promise<readonly XenoCantoRecording[]>;
  loadEbirdTaxonomy?: () => Promise<readonly EbirdTaxon[]>;
  lookupWikipedia: (scientificName: string) => Promise<WikipediaTaxon | null>;
  download: (sourceUrl: string) => Promise<DownloadedAudio>;
  store: (input: {
    slug: string;
    sourceUrl: string;
    downloaded: DownloadedAudio;
  }) => Promise<StoredAudio>;
};

export type GenerateAudioManifestOptions = {
  generatedAt: string;
  refresh?: boolean;
  previous?: AudioManifest;
};

export type AudioGenerationReport = {
  species: number;
  selected: number;
  unavailable: number;
  downloaded: number;
  bytes: number;
};

export type AudioGenerationFailure =
  | {
      scope: "species";
      slug: string;
      sciName: string;
      stage: "eBird taxonomy" | "xeno-canto" | "download" | "store" | "wikipedia";
      message: string;
    }
  | {
      scope: "global";
      stage: "eBird taxonomy" | "validation";
      message: string;
    };

export type AudioGenerationProgress = AudioGenerationReport & {
  completed: number;
  completedSlugs: string[];
  failed: AudioGenerationFailure[];
};

export class AudioGenerationError extends Error {
  readonly progress: AudioGenerationProgress;

  constructor(progress: AudioGenerationProgress, cause: unknown) {
    const reason = cause instanceof Error ? cause.message : String(cause);
    const failure = progress.failed.at(-1);
    const subject =
      failure?.scope === "species"
        ? ` for ${failure.sciName} during ${failure.stage}`
        : failure
          ? ` during ${failure.stage}`
          : "";
    super(`Audio generation failed${subject}: ${reason}`, { cause });
    this.name = "AudioGenerationError";
    this.progress = progress;
  }
}

export type GenerateAudioManifestResult = {
  manifest: AudioManifest;
  report: AudioGenerationReport;
};

const UNAVAILABLE_REASON =
  "No exact-name xeno-canto recording with an accepted licence was found.";

function exactTaxon(
  scientificName: string,
  taxa: readonly EbirdTaxon[],
): EbirdTaxon | undefined {
  const matches = taxa.filter(
    (taxon) =>
      taxon.category === "species" &&
      normalizeScientificName(taxon.scientificName) ===
        normalizeScientificName(scientificName),
  );
  if (matches.length > 1) {
    throw new Error(`eBird taxonomy has duplicate species: ${scientificName}`);
  }
  return matches[0];
}

function wikipediaArticleUrl(language: "en" | "ja" | "zhTw", title: string) {
  const encodedTitle = encodeURIComponent(title.replaceAll(" ", "_"));
  if (language === "en") return `https://en.wikipedia.org/wiki/${encodedTitle}`;
  if (language === "ja") return `https://ja.wikipedia.org/wiki/${encodedTitle}`;
  return `https://zh.wikipedia.org/zh-tw/${encodedTitle}`;
}

export function wikipediaUrlsForTaxon(taxon: WikipediaTaxon) {
  if (!taxon.en) return undefined;
  const en = wikipediaArticleUrl("en", taxon.en);
  return {
    en,
    ja: taxon.ja ? wikipediaArticleUrl("ja", taxon.ja) : en,
    zhTw: taxon.zh ? wikipediaArticleUrl("zhTw", taxon.zh) : en,
  };
}

function previousBySlug(previous: AudioManifest | undefined) {
  return new Map(previous?.species.map((entry) => [entry.slug, entry]) ?? []);
}

function generationProgress(
  guideSpecies: readonly GuideSpeciesForAudio[],
  entries: readonly AudioManifestEntry[],
  selected: number,
  unavailable: number,
  downloaded: number,
  bytes: number,
  failed: readonly AudioGenerationFailure[],
): AudioGenerationProgress {
  return {
    species: guideSpecies.length,
    selected,
    unavailable,
    downloaded,
    bytes,
    completed: entries.length,
    completedSlugs: entries.map((entry) => entry.slug),
    failed: [...failed],
  };
}

function audioFromPrevious(
  entry: AudioManifestEntry | undefined,
  scientificName: string,
  refresh: boolean,
): AudioManifestAvailable | undefined {
  if (
    refresh ||
    entry?.sciName !== scientificName ||
    entry.audio.status !== "available"
  ) {
    return undefined;
  }
  // Older manifests predate the detailed source metadata. Preserve their
  // pinned recording exactly rather than inventing metadata.
  return entry.audio;
}

export function assertManifestCoverage(
  manifest: AudioManifest,
  guideSpecies: readonly GuideSpeciesForAudio[],
): void {
  const guideSlugs = new Set<string>();
  for (const species of guideSpecies) {
    if (guideSlugs.has(species.slug)) {
      throw new Error(`Guide species has duplicate slug: ${species.slug}`);
    }
    guideSlugs.add(species.slug);
  }

  const manifestSlugs = new Set<string>();
  for (const entry of manifest.species) {
    if (manifestSlugs.has(entry.slug)) {
      throw new Error(`Audio manifest has duplicate slug: ${entry.slug}`);
    }
    manifestSlugs.add(entry.slug);
    const guide = guideSpecies.find((species) => species.slug === entry.slug);
    if (!guide) throw new Error(`Audio manifest has unknown species: ${entry.slug}`);
    if (guide.sciName !== entry.sciName) {
      throw new Error(`Scientific name changed for ${entry.slug}`);
    }
  }

  const missing = guideSpecies
    .filter((species) => !manifestSlugs.has(species.slug))
    .map((species) => species.slug);
  if (missing.length > 0) {
    throw new Error(`Audio manifest is missing Guide species: ${missing.join(", ")}`);
  }
}

/**
 * Generate a complete manifest in memory. Callers write it only after this
 * function resolves so an upstream failure cannot replace a valid manifest.
 */
export async function generateAudioManifest(
  guideSpecies: readonly GuideSpeciesForAudio[],
  adapters: AudioGeneratorAdapters,
  options: GenerateAudioManifestOptions,
): Promise<GenerateAudioManifestResult> {
  const refresh = options.refresh ?? false;
  const previous = previousBySlug(options.previous);
  let ebirdTaxonomy: readonly EbirdTaxon[] | undefined;
  try {
    ebirdTaxonomy = adapters.loadEbirdTaxonomy
      ? await adapters.loadEbirdTaxonomy()
      : undefined;
  } catch (error) {
    throw new AudioGenerationError(
      generationProgress(
        guideSpecies,
        [],
        0,
        0,
        0,
        0,
        [
          {
            scope: "global",
            stage: "eBird taxonomy",
            message: error instanceof Error ? error.message : String(error),
          },
        ],
      ),
      error,
    );
  }
  const entries: AudioManifestEntry[] = [];
  let selected = 0;
  let unavailable = 0;
  let downloaded = 0;
  let bytes = 0;
  const failed: AudioGenerationFailure[] = [];
  let firstFailureCause: unknown;

  for (const species of guideSpecies) {
    let stage: AudioGenerationFailure["stage"] = "xeno-canto";
    try {
      const old = previous.get(species.slug);
      const pinned = audioFromPrevious(old, species.sciName, refresh);
      let audio: AudioManifestEntry["audio"];

      if (pinned) {
        audio = pinned;
      } else {
        const recordings = await adapters.searchXenoCanto(species.sciName);
        const selection = selectRecording(species.sciName, recordings);
        if (!selection) {
          audio = { status: "unavailable", reason: UNAVAILABLE_REASON };
          unavailable += 1;
        } else {
          const downloadUrl = sourceUrlFor(selection.recording);
          const sourceUrl = catalogueUrlFor(selection.recording);
          stage = "download";
          const downloadedAudio = await adapters.download(downloadUrl);
          stage = "store";
          const stored = await adapters.store({
            slug: species.slug,
            sourceUrl,
            downloaded: downloadedAudio,
          });
          audio = {
            status: "available",
            file: stored.file,
            sourceUrl,
            catalogueNumber: String(selection.recording.id),
            recordist: selection.recording.rec?.trim() ?? "",
            soundType: selection.soundType,
            quality: selection.quality,
            originalFilename: selection.originalFilename,
            licenseUrl: selection.licenseUrl,
            license: selection.license,
            nonCommercial: selection.nonCommercial,
            durationSeconds: selection.durationSeconds,
            sha256: stored.sha256,
            bytes: stored.bytes,
            ...(stored.contentType || downloadedAudio.contentType
              ? { contentType: stored.contentType ?? downloadedAudio.contentType }
              : {}),
          };
          selected += 1;
          downloaded += 1;
          bytes += stored.bytes;
        }
      }

      stage = "eBird taxonomy";
      const ebird = ebirdTaxonomy
        ? exactTaxon(species.sciName, ebirdTaxonomy)
        : undefined;
      stage = "wikipedia";
      const wikipedia = await adapters.lookupWikipedia(species.sciName);
      const wikipediaUrls = wikipedia ? wikipediaUrlsForTaxon(wikipedia) : undefined;
      const preservedEbird =
        old?.ebird && (!refresh || ebirdTaxonomy === undefined)
          ? old.ebird
          : undefined;
      const links = {
        ...(ebird
          ? {
              ebird: {
                speciesCode: ebird.speciesCode,
                url: ebirdSpeciesUrl(ebird.speciesCode),
              },
            }
          : preservedEbird
            ? { ebird: preservedEbird }
            : {}),
        ...(wikipediaUrls
          ? { wikipedia: wikipediaUrls }
          : !refresh && old?.wikipedia
            ? { wikipedia: old.wikipedia }
            : {}),
      };

      entries.push({ ...species, audio, ...links });
    } catch (error) {
      if (failed.length === 0) firstFailureCause = error;
      failed.push({
        scope: "species",
        slug: species.slug,
        sciName: species.sciName,
        stage,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (failed.length > 0) {
    const firstFailure = failed[0];
    throw new AudioGenerationError(
      generationProgress(
        guideSpecies,
        entries,
        selected,
        unavailable,
        downloaded,
        bytes,
        failed,
      ),
      firstFailureCause ?? firstFailure?.message ?? "one or more species failed",
    );
  }

  const manifest: AudioManifest = {
    version: 1,
    generatedAt: options.generatedAt,
    species: entries,
  };
  try {
    assertManifestCoverage(manifest, guideSpecies);
  } catch (error) {
    throw new AudioGenerationError(
      generationProgress(
        guideSpecies,
        entries,
        selected,
        unavailable,
        downloaded,
        bytes,
        [
          {
            scope: "global",
            stage: "validation",
            message: error instanceof Error ? error.message : String(error),
          },
        ],
      ),
      error,
    );
  }
  return {
    manifest,
    report: {
      species: guideSpecies.length,
      selected,
      unavailable,
      downloaded,
      bytes,
    },
  };
}

export { UNAVAILABLE_REASON };
