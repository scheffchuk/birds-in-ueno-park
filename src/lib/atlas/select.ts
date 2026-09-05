import { prevalenceForFilter } from "@/lib/guide/prevalence";
import type { SeasonalPrevalence } from "@/lib/guide/types";
import type { SeasonFilter } from "@/lib/season/types";
import type {
  PublicAudio,
  PublicEbirdLink,
  PublicWikipediaLinks,
} from "@/lib/audio/types";

/** Lean Listed species row from `listAtlas` (card URL already preferred). */
export type AtlasListSource = {
  slug: string;
  sciName: string;
  comNameEn: string;
  comNameJa: string;
  comNameZhTw: string;
  listed: boolean;
  prevalence: SeasonalPrevalence;
  /** Perch art, else flight; omitted when neither exists. */
  imageUrl?: string;
  audio?: PublicAudio;
  ebird?: PublicEbirdLink;
  wikipedia?: PublicWikipediaLinks;
};

/**
 * Listed Guide species for the Atlas list — no art gate.
 * Filtered by Season Prevalence > 0; sorted by Prevalence descending.
 */
export function selectForAtlas(
  species: AtlasListSource[],
  filter: SeasonFilter,
) {
  return species
    .flatMap((record) => {
      if (!record.listed) return [];
      const prevalence = prevalenceForFilter(record, filter);
      if (prevalence <= 0) return [];
      return [
        {
          slug: record.slug,
          sciName: record.sciName,
          comNameEn: record.comNameEn,
          comNameJa: record.comNameJa,
          comNameZhTw: record.comNameZhTw,
          prevalence,
          ...(record.imageUrl ? { imageUrl: record.imageUrl } : {}),
          ...(record.audio ? { audio: record.audio } : {}),
          ...(record.ebird ? { ebird: record.ebird } : {}),
          ...(record.wikipedia ? { wikipedia: record.wikipedia } : {}),
        },
      ];
    })
    .sort((a, b) => b.prevalence - a.prevalence);
}
