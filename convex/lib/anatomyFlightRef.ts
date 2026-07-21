/**
 * Resolve a flight anatomy photo for IMAGE 1 on flight poses.
 *
 * Primary: iNaturalist research-grade observations (taxon + flying/flight).
 * Fallback: Wikimedia Commons File: search / "in flight" categories.
 *
 * Commons alone rate-limits hard when seeding ~20 species in a tight loop.
 */

import { boundAnatomyImageUrl } from "./anatomyImageUrl";

const USER_AGENT =
  "birds-in-ueno/0.1 (anatomy-ref seed; https://github.com/scheffchuk/birds-in-ueno-park)";

export type AnatomyResolveResult =
  | { ok: true; imageUrl: string; source: string }
  | { ok: false; reason: string };

async function wikiFetch(url: string): Promise<Response> {
  return fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT,
      "Api-User-Agent": USER_AGENT,
    },
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function isRasterImageTitle(title: string): boolean {
  return /\.(jpe?g|png|webp)$/i.test(title);
}

// --- iNaturalist -----------------------------------------------------------

type InatPhotoHit = { imageUrl: string; source: string };

/** Prefer large still from iNat photo URL templates (`square` → `large`). */
export function inatLargePhotoUrl(squareOrMediumUrl: string): string {
  return squareOrMediumUrl
    .replace("/square.", "/large.")
    .replace("/small.", "/large.")
    .replace("/medium.", "/large.")
    .replace("/thumb.", "/large.");
}

async function inatFlightPhotos(input: {
  sciName: string;
  comNameEn: string;
}): Promise<InatPhotoHit | null> {
  const queries = ["flying", "in flight", "flight"];
  for (const q of queries) {
    const hit = await inatSearch(input.sciName, q);
    if (hit) return hit;
    await sleep(200);
  }
  // Common-name pass (helps when sci name is obscure / recently split).
  for (const q of queries) {
    const hit = await inatSearch(input.comNameEn, q);
    if (hit) return hit;
    await sleep(200);
  }
  return null;
}

async function inatSearch(
  taxonName: string,
  q: string,
): Promise<InatPhotoHit | null> {
  const params = new URLSearchParams({
    taxon_name: taxonName,
    q,
    photos: "true",
    quality_grade: "research",
    // Anatomy refs stay on our CDN — NC is acceptable for generation refs.
    photo_license: "cc0,cc-by,cc-by-sa,cc-by-nc",
    per_page: "12",
    order_by: "votes",
  });
  const res = await fetch(
    `https://api.inaturalist.org/v1/observations?${params.toString()}`,
    {
      headers: {
        Accept: "application/json",
        "User-Agent": USER_AGENT,
      },
    },
  );
  if (!res.ok) return null;
  const json = (await res.json()) as {
    results?: Array<{
      id?: number;
      photos?: Array<{ url?: string; license_code?: string }>;
    }>;
  };
  for (const obs of json.results ?? []) {
    const photo = obs.photos?.[0];
    const url = photo?.url;
    if (!url || !obs.id) continue;
    // Skip obvious non-stills if URL path says so.
    if (/\.(webm|mp4|pdf)(\?|$)/i.test(url)) continue;
    return {
      imageUrl: inatLargePhotoUrl(url),
      source: `inat:${taxonName} q=${q} obs=${obs.id}`,
    };
  }
  return null;
}

// --- Commons fallback ------------------------------------------------------

type CommonsHit = {
  title: string;
  url: string;
  description?: string;
  categories?: string;
};

const FLIGHT_RE =
  /\b(in[ _-]?flight|flying|flight|fliegend|en[ _-]?vol|in[ _-]?volo|en[ _-]?vuelo)\b/i;

export function scoreFlightText(text: string): number {
  const t = text.toLowerCase();
  let score = 0;
  if (/\bin[_ -]?flight\b/.test(t)) score += 50;
  if (/\bflying\b/.test(t)) score += 40;
  if (/\bflight\b/.test(t)) score += 25;
  if (/\bwings?\s+(spread|open|extended)\b/.test(t)) score += 20;
  if (/\bin[_ -]?volo\b/.test(t) || /\ben[_ -]?vol\b/.test(t)) score += 30;
  if (/\bfliegend\b/.test(t) || /\ben[_ -]?vuelo\b/.test(t)) score += 30;
  if (/birds? in flight/i.test(t)) score += 35;
  if (/\.(jpe?g|png)$/i.test(t)) score += 5;
  if (
    /map|diagram|silhouette|range|distribution|logo|coat of arms|museum specimen|skeleton/i.test(
      t,
    )
  ) {
    score -= 40;
  }
  return score;
}

export function scoreFlightHit(hit: CommonsHit): number {
  const blob = [hit.title, hit.description ?? "", hit.categories ?? ""].join(
    " ",
  );
  return scoreFlightText(blob);
}

export function pickBestFlightHit(hits: CommonsHit[]): CommonsHit | null {
  const ranked = hits
    .map((h) => ({ hit: h, score: scoreFlightHit(h) }))
    .filter((x) => x.score >= 20)
    .sort((a, b) => b.score - a.score);
  return ranked[0]?.hit ?? null;
}

async function parseCommonsPages(text: string): Promise<CommonsHit[]> {
  let json: {
    query?: {
      pages?: Record<
        string,
        {
          title?: string;
          imageinfo?: Array<{
            thumburl?: string;
            url?: string;
            extmetadata?: Record<string, { value?: string }>;
          }>;
        }
      >;
    };
  };
  try {
    json = JSON.parse(text) as typeof json;
  } catch {
    // Rate-limit HTML/plaintext from Commons.
    return [];
  }
  const hits: CommonsHit[] = [];
  for (const page of Object.values(json.query?.pages ?? {})) {
    const title = page.title;
    const info = page.imageinfo?.[0];
    const raw = info?.thumburl ?? info?.url;
    if (!title || !raw || !isRasterImageTitle(title)) continue;
    const meta = info?.extmetadata ?? {};
    hits.push({
      title,
      url: boundAnatomyImageUrl(raw),
      description: stripHtml(meta.ImageDescription?.value ?? ""),
      categories: meta.Categories?.value ?? "",
    });
  }
  return hits;
}

async function commonsSearch(
  query: string,
  limit = 15,
): Promise<CommonsHit[]> {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    generator: "search",
    gsrsearch: `${query} filetype:bitmap`,
    gsrnamespace: "6",
    gsrlimit: String(limit),
    prop: "imageinfo",
    iiprop: "url|extmetadata",
    iiextmetadatafilter: "ImageDescription|Categories|ObjectName",
    iiurlwidth: "1600",
    origin: "*",
  });
  const res = await wikiFetch(
    `https://commons.wikimedia.org/w/api.php?${params.toString()}`,
  );
  if (!res.ok) return [];
  return parseCommonsPages(await res.text());
}

async function commonsCategoryFiles(
  categoryTitle: string,
  limit = 15,
): Promise<CommonsHit[]> {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    generator: "categorymembers",
    gcmtitle: categoryTitle.startsWith("Category:")
      ? categoryTitle
      : `Category:${categoryTitle}`,
    gcmtype: "file",
    gcmlimit: String(limit),
    prop: "imageinfo",
    iiprop: "url|extmetadata",
    iiextmetadatafilter: "ImageDescription|Categories|ObjectName",
    iiurlwidth: "1600",
    origin: "*",
  });
  const res = await wikiFetch(
    `https://commons.wikimedia.org/w/api.php?${params.toString()}`,
  );
  if (!res.ok) return [];
  const hits = await parseCommonsPages(await res.text());
  return hits.map((h) => ({
    ...h,
    categories: `${categoryTitle}|${h.categories ?? ""}`,
  }));
}

export function flightSearchQueries(input: {
  sciName: string;
  comNameEn: string;
}): string[] {
  const sci = input.sciName;
  const com = input.comNameEn;
  // Keep short — each query costs a Commons request under rate limits.
  return [`"${sci}" flight`, `"${sci}" flying`, `"${com}" "in flight"`];
}

export function flightCategoryCandidates(input: {
  sciName: string;
  comNameEn: string;
}): string[] {
  return [
    `Category:${input.sciName} in flight`,
    `Category:${input.comNameEn} in flight`,
  ];
}

async function commonsFlightPhoto(input: {
  sciName: string;
  comNameEn: string;
}): Promise<AnatomyResolveResult | null> {
  for (const cat of flightCategoryCandidates(input)) {
    const hits = await commonsCategoryFiles(cat);
    await sleep(400);
    const best = pickBestFlightHit(
      hits.map((h) =>
        FLIGHT_RE.test(cat)
          ? { ...h, categories: `${h.categories ?? ""} in flight` }
          : h,
      ),
    );
    if (best) {
      return {
        ok: true,
        imageUrl: best.url,
        source: `commons-category:${cat} → ${best.title}`,
      };
    }
  }

  for (const q of flightSearchQueries(input)) {
    const hits = await commonsSearch(q);
    await sleep(400);
    const best = pickBestFlightHit(hits);
    if (best) {
      return {
        ok: true,
        imageUrl: best.url,
        source: `commons-search:${q} → ${best.title}`,
      };
    }
  }
  return null;
}

export async function resolveFlightAnatomyImageUrl(input: {
  sciName: string;
  comNameEn: string;
}): Promise<AnatomyResolveResult> {
  const inat = await inatFlightPhotos(input);
  if (inat) {
    return { ok: true, imageUrl: inat.imageUrl, source: inat.source };
  }

  const commons = await commonsFlightPhoto(input);
  if (commons) return commons;

  return {
    ok: false,
    reason: `No flight photo via iNaturalist or Commons for ${input.sciName} / ${input.comNameEn}`,
  };
}
