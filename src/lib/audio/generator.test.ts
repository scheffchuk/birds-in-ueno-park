import { describe, expect, it } from "vitest";
import {
  generateAudioManifest,
  type AudioGeneratorAdapters,
} from "./generator";
import type { AudioManifest, GuideSpeciesForAudio } from "./types";

const species: GuideSpeciesForAudio[] = [
  {
    slug: "passer-montanus",
    sciName: "Passer montanus",
    comNameEn: "Eurasian Tree Sparrow",
    comNameJa: "スズメ",
    comNameZhTw: "樹麻雀",
  },
  {
    slug: "alcedo-atthis",
    sciName: "Alcedo atthis",
    comNameEn: "Common Kingfisher",
    comNameJa: "カワセミ",
    comNameZhTw: "翠鳥",
  },
];

function adapters(
  overrides: Partial<AudioGeneratorAdapters> = {},
): AudioGeneratorAdapters {
  return {
    searchXenoCanto: async (scientificName) => [
      {
        id: scientificName === "Passer montanus" ? "10" : "20",
        gen: scientificName.split(" ")[0],
        sp: scientificName.split(" ")[1],
        type: "song",
        q: "A",
        length: "0:20",
        "file-name": `${scientificName.replaceAll(" ", "_")}.mp3`,
        rec: "A. Recordist",
        lic: "https://creativecommons.org/licenses/by/4.0/",
        url: `https://xeno-canto.org/${scientificName}/download`,
      },
    ],
    loadEbirdTaxonomy: async () => [
      { scientificName: " Passer   montanus ", speciesCode: "eurtrs1", category: "species" },
      { scientificName: "Alcedo atthis", speciesCode: "comkin1", category: "species" },
    ],
    lookupWikipedia: async (scientificName) => ({
      taxonId: scientificName === "Passer montanus" ? "Q25391" : "Q25344",
      en: scientificName === "Passer montanus" ? "Eurasian_tree_sparrow" : "Common_kingfisher",
      ja: scientificName === "Passer montanus" ? "スズメ" : undefined,
    }),
    download: async () => ({ bytes: new Uint8Array([1, 2, 3]), contentType: "audio/mpeg" }),
    store: async ({ slug, downloaded }) => ({
      file: `data/audio/${slug}.mp3`,
      sha256: `${slug}-hash`,
      bytes: downloaded.bytes.byteLength,
      contentType: downloaded.contentType,
    }),
    ...overrides,
  };
}

describe("generateAudioManifest", () => {
  it("generates complete audio and direct reference metadata", async () => {
    const result = await generateAudioManifest(species, adapters(), {
      generatedAt: "2026-09-05T00:00:00.000Z",
    });

    expect(result.manifest.species).toHaveLength(2);
    expect(result.manifest.species[0]).toMatchObject({
      audio: {
        status: "available",
        catalogueNumber: "10",
        soundType: "song",
        quality: "A",
        originalFilename: "Passer_montanus.mp3",
        file: "data/audio/passer-montanus.mp3",
      },
      ebird: {
        speciesCode: "eurtrs1",
        url: "https://ebird.org/species/eurtrs1",
      },
      wikipedia: {
        en: "https://en.wikipedia.org/wiki/Eurasian_tree_sparrow",
        ja: "https://ja.wikipedia.org/wiki/%E3%82%B9%E3%82%BA%E3%83%A1",
        zhTw: "https://en.wikipedia.org/wiki/Eurasian_tree_sparrow",
      },
    });
    expect(result.report).toEqual({
      species: 2,
      selected: 2,
      unavailable: 0,
      downloaded: 2,
      bytes: 6,
    });
  });

  it("writes an explicit unavailable entry without dropping the species", async () => {
    const result = await generateAudioManifest(
      species,
      adapters({
        searchXenoCanto: async (scientificName) =>
          scientificName === "Passer montanus" ? [] : [],
      }),
      { generatedAt: "now" },
    );

    expect(result.manifest.species[0]?.audio).toEqual({
      status: "unavailable",
      reason: "No exact-name xeno-canto recording with an accepted licence was found.",
    });
    expect(result.report.unavailable).toBe(2);
  });

  it("preserves pinned recordings and links during a normal run", async () => {
    const previous: AudioManifest = {
      version: 1,
      generatedAt: "before",
      species: species.map((entry) => ({
        ...entry,
        audio: {
          status: "available",
          file: `data/audio/${entry.slug}.ogg`,
          sourceUrl: `https://old.example/${entry.slug}`,
          catalogueNumber: "999",
          recordist: "Pinned Recordist",
          soundType: "song",
          quality: "A",
          originalFilename: "pinned.mp3",
          licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
          license: "CC BY",
          nonCommercial: false,
          durationSeconds: 12,
          sha256: "pinned-hash",
          bytes: 42,
        },
        ebird: { speciesCode: `${entry.slug}-old`, url: "https://old.example/ebird" },
        wikipedia: {
          en: "https://old.example/en",
          ja: "https://old.example/ja",
          zhTw: "https://old.example/zh-tw",
        },
      })),
    };
    let searched = 0;
    const result = await generateAudioManifest(
      species,
      adapters({
        searchXenoCanto: async () => {
          searched += 1;
          return [];
        },
      }),
      { generatedAt: "after", previous },
    );

    expect(searched).toBe(0);
    expect(result.report.downloaded).toBe(0);
    expect(result.manifest.species[0]?.audio).toEqual(previous.species[0]?.audio);
    expect(result.manifest.species[0]?.ebird).toEqual({
      speciesCode: "eurtrs1",
      url: "https://ebird.org/species/eurtrs1",
    });
  });

  it("recomputes pinned recordings only in refresh mode", async () => {
    const previous: AudioManifest = {
      version: 1,
      generatedAt: "before",
      species: species.map((entry) => ({
        ...entry,
        audio: {
          status: "available",
          file: "data/audio/old.mp3",
          sourceUrl: "https://old.example/audio",
          catalogueNumber: "999",
          recordist: "Old Recordist",
          soundType: "song",
          quality: "A",
          originalFilename: "old.mp3",
          licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
          license: "CC BY",
          nonCommercial: false,
          durationSeconds: 15,
          sha256: "old",
          bytes: 1,
        },
      })),
    };
    const result = await generateAudioManifest(species, adapters(), {
      generatedAt: "after",
      previous,
      refresh: true,
    });

    expect(result.manifest.species[0]?.audio).toMatchObject({
      status: "available",
      catalogueNumber: "10",
      sha256: "passer-montanus-hash",
    });
  });

  it("keeps existing eBird links when optional taxonomy enrichment is unavailable", async () => {
    const previous: AudioManifest = {
      version: 1,
      generatedAt: "before",
      species: species.map((entry) => ({
        ...entry,
        audio: {
          status: "available",
          file: `data/audio/${entry.slug}.mp3`,
          sourceUrl: "https://xeno-canto.org/1",
          catalogueNumber: "1",
          recordist: "Recordist",
          soundType: "song",
          quality: "A",
          originalFilename: "same.mp3",
          licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
          license: "CC BY",
          nonCommercial: false,
          durationSeconds: 12,
          sha256: "same",
          bytes: 3,
        },
        ebird: { speciesCode: "existing1", url: "https://ebird.org/species/existing1" },
      })),
    };

    const result = await generateAudioManifest(
      species,
      adapters({ loadEbirdTaxonomy: undefined }),
      { generatedAt: "after", previous, refresh: true },
    );

    expect(result.manifest.species[0]?.ebird).toEqual(previous.species[0]?.ebird);
  });

  it("reports resumable progress without returning a partial manifest", async () => {
    const lookupWikipedia = adapters().lookupWikipedia;
    const error = await generateAudioManifest(species, adapters({
      lookupWikipedia: async (scientificName) => {
        if (scientificName === "Alcedo atthis") {
          throw new Error("Wikidata is temporarily unavailable");
        }
        return lookupWikipedia(scientificName);
      },
    }), { generatedAt: "now" }).catch((failure: unknown) => failure);

    expect(error).toMatchObject({
      name: "AudioGenerationError",
      progress: {
        completed: 1,
        completedSlugs: ["passer-montanus"],
        selected: 2,
        unavailable: 0,
        downloaded: 2,
        bytes: 6,
        failed: [
          {
            slug: "alcedo-atthis",
            stage: "wikipedia",
          },
        ],
      },
    });
  });

  it("continues independent species and reports every failure", async () => {
    const thirdSpecies: GuideSpeciesForAudio = {
      slug: "cettia-diphone",
      sciName: "Cettia diphone",
      comNameEn: "Japanese Bush Warbler",
      comNameJa: "ウグイス",
      comNameZhTw: "日本樹鶯",
    };
    const lookupWikipedia = adapters().lookupWikipedia;
    const error = await generateAudioManifest(
      [...species, thirdSpecies],
      adapters({
        lookupWikipedia: async (scientificName) => {
          if (scientificName !== "Alcedo atthis") {
            throw new Error("Wikidata is temporarily unavailable");
          }
          return lookupWikipedia(scientificName);
        },
      }),
      { generatedAt: "now" },
    ).catch((failure: unknown) => failure);

    expect(error).toMatchObject({
      name: "AudioGenerationError",
      progress: {
        completed: 1,
        completedSlugs: ["alcedo-atthis"],
        failed: [
          { slug: "passer-montanus", stage: "wikipedia" },
          { slug: "cettia-diphone", stage: "wikipedia" },
        ],
      },
    });
  });
});
