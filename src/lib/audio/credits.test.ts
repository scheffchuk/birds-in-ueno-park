import { describe, expect, it } from "vitest";
import audioManifestData from "../../../data/audio-manifest.json";
import { audioCreditsForManifest, safeExternalUrl } from "./credits";
import type { AudioManifest } from "./types";

const manifest: AudioManifest = {
  version: 1,
  generatedAt: "2026-09-06T00:00:00.000Z",
  species: [
    {
      slug: "parus-major",
      sciName: "Parus major",
      comNameEn: "Great Tit",
      comNameJa: "シジュウカラ",
      comNameZhTw: "大山雀",
      audio: {
        status: "available",
        file: "data/audio/parus-major.mp3",
        sourceUrl: "https://xeno-canto.org/123456",
        catalogueNumber: "123456",
        recordist: "A Recordist",
        licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
        license: "CC BY",
        nonCommercial: false,
        durationSeconds: 12,
        sha256: "hash",
        bytes: 12,
      },
    },
    {
      slug: "unavailable-bird",
      sciName: "Unavailable bird",
      comNameEn: "Unavailable bird",
      comNameJa: "記録なしの鳥",
      comNameZhTw: "無錄音鳥",
      audio: {
        status: "unavailable",
        reason: "No eligible recording",
      },
    },
  ],
};

describe("audio credits", () => {
  it("projects every available recording in the committed manifest", () => {
    const manifest = audioManifestData as AudioManifest;
    const availableEntries = manifest.species.filter(
      (entry) => entry.audio.status === "available",
    );
    const credits = audioCreditsForManifest(manifest);

    expect(credits).toHaveLength(availableEntries.length);
    availableEntries.forEach((entry, index) => {
      if (entry.audio.status !== "available") return;

      expect(credits[index]).toEqual({
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
      });
    });
    expect(
      credits.every(
        (credit) =>
          safeExternalUrl(credit.sourceUrl) !== undefined &&
          safeExternalUrl(credit.licenseUrl) !== undefined,
      ),
    ).toBe(true);
  });

  it("maps available manifest attribution and omits unavailable species", () => {
    expect(audioCreditsForManifest(manifest)).toEqual([
      {
        slug: "parus-major",
        sciName: "Parus major",
        names: {
          comNameEn: "Great Tit",
          comNameJa: "シジュウカラ",
          comNameZhTw: "大山雀",
        },
        recordist: "A Recordist",
        catalogueNumber: "123456",
        sourceUrl: "https://xeno-canto.org/123456",
        licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
        license: "CC BY",
      },
    ]);
  });

  it("accepts HTTPS links and rejects unsafe external URL schemes", () => {
    expect(safeExternalUrl("https://xeno-canto.org/123456")).toBe(
      "https://xeno-canto.org/123456",
    );
    expect(safeExternalUrl("javascript:alert(1)")).toBeUndefined();
    expect(safeExternalUrl("//xeno-canto.org/123456")).toBeUndefined();
  });
});
