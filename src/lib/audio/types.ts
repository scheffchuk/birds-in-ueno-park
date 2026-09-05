export type AudioStatus = "available" | "unavailable";

export type AudioManifestAvailable = {
  status: "available";
  file: string;
  sourceUrl: string;
  catalogueNumber: string;
  recordist: string;
  licenseUrl: string;
  license: string;
  nonCommercial: boolean;
  durationSeconds: number;
  sha256: string;
  bytes: number;
  contentType?: string;
};

export type AudioManifestUnavailable = {
  status: "unavailable";
  reason: string;
};

export type AudioManifestAudio =
  | AudioManifestAvailable
  | AudioManifestUnavailable;

export type SpeciesExternalLinks = {
  ebird?: {
    speciesCode: string;
    url: string;
  };
  wikipedia?: {
    en: string;
    ja: string;
    zhTw: string;
  };
};

export type AudioManifestEntry = SpeciesExternalLinks & {
  slug: string;
  sciName: string;
  comNameEn: string;
  comNameJa: string;
  comNameZhTw: string;
  audio: AudioManifestAudio;
};

export type AudioManifest = {
  version: 1;
  generatedAt: string;
  species: AudioManifestEntry[];
};

export type GuideSpeciesForAudio = Pick<
  AudioManifestEntry,
  "slug" | "sciName" | "comNameEn" | "comNameJa" | "comNameZhTw"
>;

export type XenoCantoRecording = {
  id: string | number;
  gen?: string;
  sp?: string;
  scientificName?: string;
  type?: string;
  q?: string;
  length?: string | number;
  duration?: string | number;
  lic?: string;
  licence?: string;
  license?: string;
  licenceUrl?: string;
  licenseUrl?: string;
  url?: string;
  file?: string;
  rec?: string;
  remarks?: string;
  rmk?: string;
  "bird-seen"?: string;
};

export type EbirdTaxon = {
  scientificName: string;
  speciesCode: string;
  category: string;
};

export type WikipediaTaxon = {
  taxonId: string;
  en?: string;
  ja?: string;
  zh?: string;
};

export type DownloadedAudio = {
  bytes: Uint8Array;
  contentType?: string;
};

export type PublicAudio = {
  status: AudioStatus;
  url?: string;
  sourceUrl?: string;
  catalogueNumber?: string;
  recordist?: string;
  licenseUrl?: string;
  license?: string;
  nonCommercial?: boolean;
  durationSeconds?: number;
  sha256?: string;
  bytes?: number;
  contentType?: string;
  unavailableReason?: string;
};

export type PublicEbirdLink = {
  speciesCode: string;
  url: string;
};

export type PublicWikipediaLinks = {
  en: string;
  ja: string;
  zhTw: string;
};
