import { createHash } from "node:crypto";
import type { AudioManifest, AudioManifestEntry } from "./types";

export type ExistingAudioState = {
  status?: "available" | "unavailable";
  sha256?: string;
  storageId?: string;
};

export type AudioSyncAdapters = {
  listExisting: (slugs: readonly string[]) => Promise<Record<string, ExistingAudioState>>;
  readFile: (file: string) => Promise<Uint8Array>;
  upload: (input: { slug: string; file: string; bytes: Uint8Array }) => Promise<string>;
  commit: (input: {
    entry: AudioManifestEntry;
    storageId?: string;
  }) => Promise<void>;
};

export type AudioSyncFileReport = {
  slug: string;
  status: "uploaded" | "skipped" | "unavailable";
  bytes: number;
};

/** ConvexHttpClient appends /api paths, so deployment URLs cannot end in /. */
export function normalizeConvexDeploymentUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

export type AudioSyncReport = {
  files: AudioSyncFileReport[];
  uploaded: number;
  skipped: number;
  unavailable: number;
  totalBytes: number;
};

/** Sync a manifest to one explicitly selected Convex deployment. */
export async function syncAudioManifest(
  manifest: AudioManifest,
  adapters: AudioSyncAdapters,
): Promise<AudioSyncReport> {
  const existing = await adapters.listExisting(
    manifest.species.map((entry) => entry.slug),
  );
  const files: AudioSyncFileReport[] = [];
  let uploaded = 0;
  let skipped = 0;
  let unavailable = 0;
  let totalBytes = 0;

  for (const entry of manifest.species) {
    const old = existing[entry.slug];
    if (entry.audio.status === "unavailable") {
      await adapters.commit({ entry });
      unavailable += 1;
      files.push({ slug: entry.slug, status: "unavailable", bytes: 0 });
      continue;
    }

    if (
      old?.status === "available" &&
      old.sha256 === entry.audio.sha256 &&
      old.storageId
    ) {
      // Preserve the existing blob while refreshing provenance or reference links.
      await adapters.commit({ entry, storageId: old.storageId });
      skipped += 1;
      files.push({ slug: entry.slug, status: "skipped", bytes: entry.audio.bytes });
      totalBytes += entry.audio.bytes;
      continue;
    }

    const bytes = await adapters.readFile(entry.audio.file);
    if (bytes.byteLength !== entry.audio.bytes) {
      throw new Error(
        `Audio size changed for ${entry.slug}: manifest ${entry.audio.bytes}, file ${bytes.byteLength}`,
      );
    }
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    if (sha256 !== entry.audio.sha256) {
      throw new Error(
        `Audio hash changed for ${entry.slug}: manifest ${entry.audio.sha256}, file ${sha256}`,
      );
    }
    const storageId = await adapters.upload({
      slug: entry.slug,
      file: entry.audio.file,
      bytes,
    });
    // The Convex mutation patches the species before deleting any old blob.
    await adapters.commit({ entry, storageId });
    uploaded += 1;
    totalBytes += bytes.byteLength;
    files.push({ slug: entry.slug, status: "uploaded", bytes: bytes.byteLength });
  }

  return { files, uploaded, skipped, unavailable, totalBytes };
}
