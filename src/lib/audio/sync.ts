import { createHash } from "node:crypto";
import type { AudioManifest, AudioManifestEntry } from "./types";

export type AudioSyncArguments = {
  production: boolean;
};

export type AudioSyncTarget = {
  environment: "development" | "production";
  url: string;
};

/** Parse only the flags supported by the storage sync command. */
export function parseAudioSyncArgs(
  argv: readonly string[],
): AudioSyncArguments {
  let production = false;
  for (const argument of argv) {
    if (argument !== "--prod") {
      throw new Error(`Unknown option for audio sync: ${argument}`);
    }
    if (production) {
      throw new Error("The --prod option cannot be supplied more than once");
    }
    production = true;
  }
  return { production };
}

function normalizeDeploymentUrl(
  value: string | undefined,
  variable: string,
): { value: string; comparable: string } | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error(`${variable} must be a valid HTTP(S) URL`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`${variable} must be a valid HTTP(S) URL`);
  }
  const normalized = parsed.href.replace(/\/+$/, "");
  return { value: normalized, comparable: normalized };
}

/** Select a deployment without allowing a production URL to be inferred. */
export function resolveAudioSyncTarget(input: {
  production: boolean;
  developmentUrl?: string;
  productionUrl?: string;
}): AudioSyncTarget {
  const development = normalizeDeploymentUrl(
    input.developmentUrl,
    "NEXT_PUBLIC_CONVEX_URL",
  );
  const production = normalizeDeploymentUrl(
    input.productionUrl,
    "CONVEX_PROD_URL",
  );

  if (
    development &&
    production &&
    development.comparable === production.comparable
  ) {
    throw new Error(
      "Ambiguous deployment target: development and production URLs are the same",
    );
  }

  if (input.production) {
    if (!production) {
      throw new Error("CONVEX_PROD_URL is required with --prod");
    }
    return { environment: "production", url: production.value };
  }
  if (!development) {
    throw new Error(
      "NEXT_PUBLIC_CONVEX_URL is required for development sync",
    );
  }
  return { environment: "development", url: development.value };
}

export type ExistingAudioState = {
  status?: "available" | "unavailable";
  sha256?: string;
  storageId?: string;
};

export type AudioSyncAdapters = {
  listExisting: (slugs: readonly string[]) => Promise<Record<string, ExistingAudioState>>;
  readFile: (file: string) => Promise<Uint8Array>;
  upload: (input: {
    slug: string;
    file: string;
    bytes: Uint8Array;
    contentType?: string;
  }) => Promise<string>;
  commit: (input: {
    entry: AudioManifestEntry;
    storageId?: string;
  }) => Promise<void>;
  /** Delete the uploaded blob only when the Convex boundary confirms it is unreferenced. */
  cleanupUpload?: (input: {
    entry: AudioManifestEntry;
    storageId: string;
  }) => Promise<void>;
};

export type AudioSyncFileReport = {
  slug: string;
  status: "uploaded" | "skipped" | "unavailable";
  bytes: number;
};

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
      ...(entry.audio.contentType
        ? { contentType: entry.audio.contentType }
        : {}),
    });
    // The Convex mutation patches the species before deleting any old blob.
    try {
      await adapters.commit({ entry, storageId });
    } catch (error) {
      if (adapters.cleanupUpload) {
        try {
          await adapters.cleanupUpload({ entry, storageId });
        } catch (cleanupError) {
          const message =
            cleanupError instanceof Error
              ? cleanupError.message
              : String(cleanupError);
          throw new Error(
            `Audio sync cleanup failed for ${entry.slug}: ${message}`,
            { cause: error },
          );
        }
      }
      throw error;
    }
    uploaded += 1;
    totalBytes += bytes.byteLength;
    files.push({ slug: entry.slug, status: "uploaded", bytes: bytes.byteLength });
  }

  return { files, uploaded, skipped, unavailable, totalBytes };
}
