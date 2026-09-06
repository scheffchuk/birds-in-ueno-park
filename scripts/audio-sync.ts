import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { assertManifestCoverage } from "../src/lib/audio/generator";
import {
  normalizeConvexDeploymentUrl,
  syncAudioManifest,
  type ExistingAudioState,
} from "../src/lib/audio/sync";
import type { AudioManifest, GuideSpeciesForAudio } from "../src/lib/audio/types";

const root = resolve(import.meta.dirname, "..");

function parseArgs(argv: string[]) {
  return { production: argv.includes("--prod") };
}

function readManifest(): AudioManifest {
  return JSON.parse(
    readFileSync(resolve(root, "data/audio-manifest.json"), "utf8"),
  ) as AudioManifest;
}

function readGuideSpecies(): GuideSpeciesForAudio[] {
  const guide = JSON.parse(
    readFileSync(resolve(root, "data/guide-species.json"), "utf8"),
  ) as GuideSpeciesForAudio[];
  return guide.map(({ slug, sciName, comNameEn, comNameJa, comNameZhTw }) => ({
    slug,
    sciName,
    comNameEn,
    comNameJa,
    comNameZhTw,
  }));
}

async function main() {
  const { production } = parseArgs(process.argv.slice(2));
  const url = production
    ? process.env.CONVEX_PROD_URL
    : process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error(
      production
        ? "CONVEX_PROD_URL is required with --prod"
        : "NEXT_PUBLIC_CONVEX_URL is required for development sync",
    );
  }
  const secret = process.env.AUDIO_SYNC_SECRET;
  if (!secret) throw new Error("AUDIO_SYNC_SECRET is required in .env.local");

  const manifest = readManifest();
  assertManifestCoverage(manifest, readGuideSpecies());
  const client = new ConvexHttpClient(normalizeConvexDeploymentUrl(url));

  const report = await syncAudioManifest(manifest, {
    listExisting: async (slugs): Promise<Record<string, ExistingAudioState>> => {
      const rows = await client.query(api.audio.listSyncState, { secret, slugs: [...slugs] });
      return Object.fromEntries(
        rows.map((row) => [
          row.slug,
          row.audio
            ? {
                status: row.audio.status,
                sha256: row.audio.sha256,
                storageId: row.audio.storageId,
              }
            : {},
        ]),
      );
    },
    readFile: async (file) => new Uint8Array(readFileSync(resolve(root, file))),
    upload: async ({ file, bytes }) => {
      const uploadUrl = await client.mutation(api.audio.generateAudioUploadUrl, {
        secret,
      });
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": file.endsWith(".ogg")
            ? "audio/ogg"
            : file.endsWith(".wav")
              ? "audio/wav"
              : "audio/mpeg",
        },
        body: new Uint8Array(bytes),
      });
      if (!response.ok) throw new Error(`Convex audio upload failed: ${response.status}`);
      const body: unknown = await response.json();
      if (
        typeof body !== "object" ||
        body === null ||
        !("storageId" in body) ||
        typeof body.storageId !== "string"
      ) {
        throw new Error("Convex audio upload did not return a storageId");
      }
      return body.storageId;
    },
    commit: async ({ entry, storageId }) => {
      const audio = entry.audio;
      await client.mutation(api.audio.syncSpeciesMedia, {
        secret,
        slug: entry.slug,
        audio:
          audio.status === "available"
            ? {
                status: "available",
                storageId: storageId as Id<"_storage">,
                sourceUrl: audio.sourceUrl,
                catalogueNumber: audio.catalogueNumber,
                recordist: audio.recordist,
                licenseUrl: audio.licenseUrl,
                license: audio.license,
                nonCommercial: audio.nonCommercial,
                durationSeconds: audio.durationSeconds,
                sha256: audio.sha256,
                bytes: audio.bytes,
                contentType: audio.contentType,
              }
            : { status: "unavailable", reason: audio.reason },
        ebird: entry.ebird ?? null,
        wikipedia: entry.wikipedia ?? null,
      });
    },
  });

  for (const file of report.files) {
    console.log(`${file.status.padEnd(11)} ${file.slug} ${file.bytes} bytes`);
  }
  console.log(
    `Audio sync (${production ? "production" : "development"}): ` +
      `${report.uploaded} uploaded, ${report.skipped} skipped, ` +
      `${report.unavailable} unavailable, ${report.totalBytes} bytes`,
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
