import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";
import {
  generateAudioManifest,
  type AudioGeneratorAdapters,
} from "../src/lib/audio/generator";
import {
  retryForbiddenRequest,
  xenoCantoQueryForSpecies,
} from "../src/lib/audio/xeno";
import type {
  AudioManifest,
  DownloadedAudio,
  EbirdTaxon,
  GuideSpeciesForAudio,
  WikipediaTaxon,
  XenoCantoRecording,
} from "../src/lib/audio/types";

const root = resolve(import.meta.dirname, "..");
const manifestPath = resolve(root, "data/audio-manifest.json");

function parseArgs(argv: string[]) {
  return { refresh: argv.includes("--refresh") };
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : undefined;
}

async function jsonFromResponse(
  response: Response,
  context?: string,
): Promise<unknown> {
  const text = await response.text();
  if (!response.ok) {
    const prefix = context ? `${context}: ` : "";
    throw new Error(`${prefix}Upstream request failed: ${response.status} ${text}`);
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error("Upstream response was not valid JSON");
  }
}

function readGuideSpecies(): GuideSpeciesForAudio[] {
  const guide = JSON.parse(
    readFileSync(resolve(root, "data/guide-species.json"), "utf8"),
  ) as Array<GuideSpeciesForAudio>;
  return guide.map(({ slug, sciName, comNameEn, comNameJa, comNameZhTw }) => ({
    slug,
    sciName,
    comNameEn,
    comNameJa,
    comNameZhTw,
  }));
}

function readPrevious(): AudioManifest | undefined {
  if (!existsSync(manifestPath)) return undefined;
  return JSON.parse(readFileSync(manifestPath, "utf8")) as AudioManifest;
}

function titleFromArticleUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const last = value.split("/").at(-1);
  return last ? decodeURIComponent(last).replaceAll("_", " ") : undefined;
}

function bindingValue(
  binding: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = asRecord(binding[key]);
  return typeof value?.value === "string" ? value.value : undefined;
}

function createAdapters(): AudioGeneratorAdapters {
  const xenoKey = process.env.XENO_CANTO_API_KEY;
  const ebirdKey = process.env.EBIRD_API_KEY;
  if (!xenoKey) throw new Error("XENO_CANTO_API_KEY is required in .env.local");
  if (!ebirdKey) {
    console.warn("EBIRD_API_KEY not set; skipping eBird link enrichment.");
  }

  let nextRequestAt = 0;
  async function pace() {
    const wait = Math.max(0, nextRequestAt - Date.now());
    if (wait > 0) await new Promise((resolveWait) => setTimeout(resolveWait, wait));
    nextRequestAt = Date.now() + 1_000;
  }

  const loadEbirdTaxonomy = ebirdKey
    ? async (): Promise<readonly EbirdTaxon[]> => {
        const apiKey = ebirdKey;
        await pace();
        const url = new URL("https://api.ebird.org/v2/ref/taxonomy/ebird");
        url.searchParams.set("fmt", "json");
        const body = await jsonFromResponse(
          await fetch(url, { headers: { "X-eBirdApiToken": apiKey } }),
        );
        if (!Array.isArray(body)) throw new Error("eBird taxonomy response was not an array");
        return body.filter((row): row is EbirdTaxon => {
          const value = asRecord(row);
          return (
            typeof value?.sciName === "string" &&
            typeof value.speciesCode === "string" &&
            typeof value.category === "string"
          );
        });
      }
    : undefined;

  return {
    searchXenoCanto: async (scientificName) => {
      const allRecordings: XenoCantoRecording[] = [];
      let page = 1;
      let pageCount = 1;
      do {
        const url = new URL("https://xeno-canto.org/api/3/recordings");
        url.searchParams.set("query", xenoCantoQueryForSpecies(scientificName));
        url.searchParams.set("key", xenoKey);
        url.searchParams.set("page", String(page));
        url.searchParams.set("per_page", "500");
        const response = await retryForbiddenRequest(
          async () => {
            await pace();
            return fetch(url);
          },
        );
        const body = asRecord(
          await jsonFromResponse(
            response,
            `xeno-canto ${scientificName} page ${page}`,
          ),
        );
        const recordings = body?.recordings;
        if (!Array.isArray(recordings)) {
          throw new Error("xeno-canto response did not contain recordings");
        }
        allRecordings.push(
          ...recordings.filter((recording): recording is XenoCantoRecording => {
            const row = asRecord(recording);
            return typeof row?.id === "string" || typeof row?.id === "number";
          }),
        );
        const rawPageCount = body?.numPages;
        pageCount =
          typeof rawPageCount === "number"
            ? rawPageCount
            : typeof rawPageCount === "string"
              ? Number(rawPageCount)
              : pageCount;
        page += 1;
      } while (page <= pageCount);
      return allRecordings;
    },

    ...(loadEbirdTaxonomy ? { loadEbirdTaxonomy } : {}),

    lookupWikipedia: async (scientificName): Promise<WikipediaTaxon | null> => {
      await pace();
      const sparql = `
        SELECT ?taxon ?enArticle ?jaArticle ?zhArticle WHERE {
          ?taxon wdt:P225 ${JSON.stringify(scientificName)} .
          OPTIONAL { ?enArticle schema:about ?taxon; schema:isPartOf <https://en.wikipedia.org/> . }
          OPTIONAL { ?jaArticle schema:about ?taxon; schema:isPartOf <https://ja.wikipedia.org/> . }
          OPTIONAL { ?zhArticle schema:about ?taxon; schema:isPartOf <https://zh.wikipedia.org/> . }
        }
        LIMIT 2
      `;
      const url = new URL("https://query.wikidata.org/sparql");
      url.searchParams.set("query", sparql);
      url.searchParams.set("format", "json");
      const body = asRecord(await jsonFromResponse(await fetch(url, {
        headers: { Accept: "application/sparql-results+json" },
      })));
      const results = asRecord(body?.results);
      const bindings = results?.bindings;
      if (!Array.isArray(bindings) || bindings.length === 0) return null;
      if (bindings.length > 1) throw new Error(`Wikidata has duplicate taxa: ${scientificName}`);
      const binding = asRecord(bindings[0]);
      const taxonUrl = binding ? bindingValue(binding, "taxon") : undefined;
      const taxonId = taxonUrl?.split("/").at(-1);
      const en = binding ? titleFromArticleUrl(bindingValue(binding, "enArticle")) : undefined;
      if (!taxonId || !en) return null;
      return {
        taxonId,
        en,
        ja: binding ? titleFromArticleUrl(bindingValue(binding, "jaArticle")) : undefined,
        zh: binding ? titleFromArticleUrl(bindingValue(binding, "zhArticle")) : undefined,
      };
    },

    download: async (sourceUrl): Promise<DownloadedAudio> => {
      await pace();
      const response = await fetch(sourceUrl);
      if (!response.ok) throw new Error(`Audio download failed: ${response.status}`);
      return {
        bytes: new Uint8Array(await response.arrayBuffer()),
        contentType: response.headers.get("content-type")?.split(";", 1)[0],
      };
    },

    store: async ({ slug, downloaded }) => {
      const contentType = downloaded.contentType ?? "audio/mpeg";
      const extension = contentType.includes("ogg")
          ? ".ogg"
          : contentType.includes("wav")
            ? ".wav"
            : ".mp3";
      const relative = `data/audio/${slug}${extension}`;
      const absolute = resolve(root, relative);
      mkdirSync(resolve(root, "data/audio"), { recursive: true });
      writeFileSync(absolute, Buffer.from(downloaded.bytes));
      return {
        file: relative,
        sha256: createHash("sha256").update(downloaded.bytes).digest("hex"),
        bytes: downloaded.bytes.byteLength,
        contentType,
      };
    },
  };
}

async function main() {
  const { refresh } = parseArgs(process.argv.slice(2));
  const guideSpecies = readGuideSpecies();
  const result = await generateAudioManifest(guideSpecies, createAdapters(), {
    generatedAt: new Date().toISOString(),
    refresh,
    previous: readPrevious(),
  });

  const temporaryPath = `${manifestPath}.tmp-${process.pid}`;
  writeFileSync(temporaryPath, JSON.stringify(result.manifest, null, 2) + "\n");
  renameSync(temporaryPath, manifestPath);
  console.log(
    `Audio selection: ${result.report.species} species, ${result.report.selected} selected, ` +
      `${result.report.unavailable} unavailable, ${result.report.bytes} downloaded bytes` +
      (refresh ? " [refresh]" : ""),
  );
  console.log(`Wrote ${manifestPath}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
