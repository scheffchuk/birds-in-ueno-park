import type { SpeciesNames } from "@/lib/locale/species";
import type { AudioManifest } from "./types";

export type AudioCredit = {
  slug: string;
  sciName: string;
  names: SpeciesNames;
  recordist: string;
  catalogueNumber: string;
  sourceUrl: string;
  licenseUrl: string;
  license: string;
};

/** Project stored manifest entries into the attribution fields shown to visitors. */
export function audioCreditsForManifest(
  manifest: AudioManifest,
): AudioCredit[] {
  return manifest.species.flatMap((entry) => {
    if (entry.audio.status !== "available") return [];

    return [
      {
        slug: entry.slug,
        sciName: entry.sciName,
        names: {
          comNameEn: entry.comNameEn,
          comNameJa: entry.comNameJa,
          comNameZhTw: entry.comNameZhTw,
        },
        recordist: entry.audio.recordist,
        catalogueNumber: entry.audio.catalogueNumber,
        sourceUrl: entry.audio.sourceUrl,
        licenseUrl: entry.audio.licenseUrl,
        license: entry.audio.license,
      },
    ];
  });
}

/** Only expose absolute HTTPS destinations as external links. */
export function safeExternalUrl(value: string): string | undefined {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) {
      return undefined;
    }
    return value;
  } catch {
    return undefined;
  }
}
