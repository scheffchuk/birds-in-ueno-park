import { describe, expect, it } from "vitest";
import { syncAudioManifest, type AudioSyncAdapters } from "./sync";
import type { AudioManifest } from "./types";

const manifest: AudioManifest = {
  version: 1,
  generatedAt: "now",
  species: [
    {
      slug: "new-bird",
      sciName: "Newus birdus",
      comNameEn: "New Bird",
      comNameJa: "新しい鳥",
      comNameZhTw: "新鳥",
      audio: {
        status: "available",
        file: "data/audio/new-bird.mp3",
        sourceUrl: "https://xeno-canto.org/1/download",
        catalogueNumber: "1",
        recordist: "Recordist",
        soundType: "song",
        quality: "A",
        originalFilename: "new-bird.mp3",
        licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
        license: "CC BY",
        nonCommercial: false,
        durationSeconds: 12,
        sha256: "039058c6f2c0cb492c533b0a4d14ef77cc0f78abccced5287d84a1a2011cfb81",
        bytes: 3,
      },
    },
    {
      slug: "same-bird",
      sciName: "Sameus birdus",
      comNameEn: "Same Bird",
      comNameJa: "同じ鳥",
      comNameZhTw: "同鳥",
      audio: {
        status: "available",
        file: "data/audio/same-bird.mp3",
        sourceUrl: "https://xeno-canto.org/2/download",
        catalogueNumber: "2",
        recordist: "Recordist",
        soundType: "song",
        quality: "A",
        originalFilename: "same-bird.mp3",
        licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
        license: "CC BY",
        nonCommercial: false,
        durationSeconds: 10,
        sha256: "same-hash",
        bytes: 4,
      },
    },
    {
      slug: "missing-bird",
      sciName: "Missingus birdus",
      comNameEn: "Missing Bird",
      comNameJa: "いない鳥",
      comNameZhTw: "缺少的鳥",
      audio: { status: "unavailable", reason: "No recording" },
    },
  ],
};

function adapters(events: string[]): AudioSyncAdapters {
  return {
    listExisting: async () => {
      events.push("list");
      return {
        "same-bird": { status: "available", sha256: "same-hash", storageId: "old-storage" },
        "missing-bird": { status: "available", sha256: "old-hash", storageId: "old-missing" },
      };
    },
    readFile: async () => {
      events.push("read");
      return new Uint8Array([1, 2, 3]);
    },
    upload: async () => {
      events.push("upload");
      return "new-storage";
    },
    commit: async ({ entry, storageId }) => {
      events.push(`commit:${entry.slug}:${storageId ?? "none"}`);
    },
  };
}

describe("syncAudioManifest", () => {
  it("skips unchanged hashes, uploads new files, and reports unavailable entries", async () => {
    const events: string[] = [];
    const report = await syncAudioManifest(manifest, adapters(events));

    expect(events).toEqual([
      "list",
      "read",
      "upload",
      "commit:new-bird:new-storage",
      "commit:same-bird:old-storage",
      "commit:missing-bird:none",
    ]);
    expect(report).toEqual({
      files: [
        { slug: "new-bird", status: "uploaded", bytes: 3 },
        { slug: "same-bird", status: "skipped", bytes: 4 },
        { slug: "missing-bird", status: "unavailable", bytes: 0 },
      ],
      uploaded: 1,
      skipped: 1,
      unavailable: 1,
      totalBytes: 7,
    });
  });
});
