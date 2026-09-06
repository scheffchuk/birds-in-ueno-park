import { describe, expect, it } from "vitest";
import {
  parseAudioSyncArgs,
  resolveAudioSyncTarget,
  syncAudioManifest,
  type AudioSyncAdapters,
} from "./sync";
import type { AudioManifest, AudioManifestEntry, AudioManifestAvailable } from "./types";

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

  it("updates metadata through the fake Convex boundary and cleans up after replacement", async () => {
    const events: string[] = [];
    const records = new Map<string, { sha256: string; storageId: string }>([
      ["new-bird", { sha256: "old-hash", storageId: "old-storage" }],
    ]);
    const storage = new Set(["old-storage"]);
    const committed = new Map<string, AudioManifestEntry>();
    const baseEntry = manifest.species[0]!;
    const entry: AudioManifestEntry = {
      ...baseEntry,
      audio:
        baseEntry.audio.status === "available"
          ? { ...baseEntry.audio, contentType: "audio/wav" }
          : baseEntry.audio,
      ebird: {
        speciesCode: "newbird1",
        url: "https://ebird.org/species/newbird1",
      },
      wikipedia: {
        en: "https://en.wikipedia.org/wiki/New_Bird",
        ja: "https://ja.wikipedia.org/wiki/New_Bird",
        zhTw: "https://zh.wikipedia.org/zh-tw/New_Bird",
      },
    };
    const syncManifest: AudioManifest = { ...manifest, species: [entry] };
    const boundary: AudioSyncAdapters = {
      listExisting: async () => {
        events.push("list");
        return {
          "new-bird": {
            status: "available",
            sha256: records.get("new-bird")!.sha256,
            storageId: records.get("new-bird")!.storageId,
          },
        };
      },
      readFile: async () => {
        events.push("read");
        return new Uint8Array([1, 2, 3]);
      },
      upload: async ({ contentType }) => {
        expect(contentType).toBe("audio/wav");
        events.push("upload");
        storage.add("new-storage");
        return "new-storage";
      },
      commit: async ({ entry: committedEntry, storageId }) => {
        events.push(`patch:${committedEntry.slug}`);
        committed.set(committedEntry.slug, committedEntry);
        const previous = records.get(committedEntry.slug)?.storageId;
        records.set(committedEntry.slug, {
          sha256: committedEntry.audio.status === "available"
            ? committedEntry.audio.sha256
            : "",
          storageId: storageId!,
        });
        if (previous && previous !== storageId) {
          storage.delete(previous);
          events.push(`delete:${previous}`);
        }
      },
    };

    await syncAudioManifest(syncManifest, boundary);

    expect(events).toEqual(["list", "read", "upload", "patch:new-bird", "delete:old-storage"]);
    expect(committed.get("new-bird")).toMatchObject({
      ebird: entry.ebird,
      wikipedia: entry.wikipedia,
      audio: {
        sourceUrl: entry.audio.status === "available" ? entry.audio.sourceUrl : undefined,
      },
    });
    expect(records.get("new-bird")?.storageId).toBe("new-storage");
    expect(storage.has("old-storage")).toBe(false);
    expect(storage.has("new-storage")).toBe(true);
  });

  it("does not change the existing reference when the replacement upload fails", async () => {
    const events: string[] = [];
    const boundary = adapters(events);
    const uploadFailure = {
      ...boundary,
      upload: async () => {
        events.push("upload");
        throw new Error("storage unavailable");
      },
    } satisfies AudioSyncAdapters;

    await expect(syncAudioManifest(manifest, uploadFailure)).rejects.toThrow(
      "storage unavailable",
    );
    expect(events).toEqual(["list", "read", "upload"]);
  });

  it("cleans an unreferenced upload when the metadata commit fails", async () => {
    const events: string[] = [];
    const storage = new Set(["old-storage"]);
    const boundary: AudioSyncAdapters = {
      listExisting: async () => {
        events.push("list");
        return {
          "new-bird": {
            status: "available",
            sha256: "old-hash",
            storageId: "old-storage",
          },
        };
      },
      readFile: async () => {
        events.push("read");
        return new Uint8Array([1, 2, 3]);
      },
      upload: async () => {
        events.push("upload");
        storage.add("new-storage");
        return "new-storage";
      },
      commit: async () => {
        events.push("commit");
        throw new Error("Convex commit failed");
      },
      cleanupUpload: async ({ storageId }) => {
        events.push(`cleanup:${storageId}`);
        storage.delete(storageId);
      },
    };

    await expect(syncAudioManifest({ ...manifest, species: [manifest.species[0]!] }, boundary)).rejects.toThrow(
      "Convex commit failed",
    );
    expect(events).toEqual(["list", "read", "upload", "commit", "cleanup:new-storage"]);
    expect(storage).toEqual(new Set(["old-storage"]));
  });

  it("rejects a changed local file before uploading or committing it", async () => {
    const events: string[] = [];
    const changed = structuredClone(manifest);
    const audio = changed.species[0]!.audio as AudioManifestAvailable;
    audio.sha256 = "not-the-file-hash";

    await expect(syncAudioManifest(changed, adapters(events))).rejects.toThrow(
      /hash changed for new-bird/i,
    );
    expect(events).toEqual(["list", "read"]);
  });
});

describe("audio sync deployment target", () => {
  it("defaults to the development deployment even when production is configured", () => {
    expect(
      resolveAudioSyncTarget({
        production: false,
        developmentUrl: "https://dev.convex.cloud/",
        productionUrl: "https://prod.convex.cloud/",
      }),
    ).toEqual({
      environment: "development",
      url: "https://dev.convex.cloud",
    });
  });

  it("requires the explicit production flag to select production", () => {
    expect(
      resolveAudioSyncTarget({
        production: true,
        developmentUrl: "https://dev.convex.cloud",
        productionUrl: "https://prod.convex.cloud",
      }),
    ).toEqual({
      environment: "production",
      url: "https://prod.convex.cloud",
    });
  });

  it("refuses a deployment URL collision", () => {
    expect(() =>
      resolveAudioSyncTarget({
        production: false,
        developmentUrl: "https://same.convex.cloud/",
        productionUrl: "https://same.convex.cloud",
      }),
    ).toThrow(/ambiguous deployment target/i);
  });

  it("refuses missing URLs instead of falling back to another deployment", () => {
    expect(() =>
      resolveAudioSyncTarget({
        production: true,
        developmentUrl: "https://dev.convex.cloud",
      }),
    ).toThrow(/CONVEX_PROD_URL/);

    expect(() =>
      resolveAudioSyncTarget({
        production: false,
        productionUrl: "https://prod.convex.cloud",
      }),
    ).toThrow(/NEXT_PUBLIC_CONVEX_URL/);
  });

  it("rejects unknown or repeated command-line flags", () => {
    expect(parseAudioSyncArgs([])).toEqual({ production: false });
    expect(parseAudioSyncArgs(["--prod"])).toEqual({ production: true });
    expect(() => parseAudioSyncArgs(["--prodd"])).toThrow(/unknown option/i);
    expect(() => parseAudioSyncArgs(["--prod", "--prod"])).toThrow(
      /more than once/i,
    );
  });
});
