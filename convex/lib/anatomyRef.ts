/**
 * Resolve a stable Wikimedia image URL for a species anatomy reference.
 * Tries enwiki summary by sci name, then common name, then Wikidata P18.
 */

import { boundAnatomyImageUrl } from "./anatomyImageUrl";

const USER_AGENT =
  "birds-in-ueno/0.1 (anatomy-ref seed; https://github.com/scheffchuk/birds-in-ueno-park)";

type WikiSummary = {
  type?: string;
  title?: string;
  originalimage?: { source?: string };
  thumbnail?: { source?: string };
};

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

function imageFromSummary(summary: WikiSummary): string | null {
  if (summary.type === "disambiguation") return null;
  // Prefer thumbnail — originalimage can be 20MB+ and blows Convex HTTP limits.
  const raw =
    summary.thumbnail?.source ?? summary.originalimage?.source ?? null;
  return raw ? boundAnatomyImageUrl(raw) : null;
}

async function summaryImage(title: string): Promise<string | null> {
  const encoded = encodeURIComponent(title.replace(/ /g, "_"));
  const res = await wikiFetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`,
  );
  if (!res.ok) return null;
  const summary = (await res.json()) as WikiSummary;
  return imageFromSummary(summary);
}

async function wikidataP18(sciName: string): Promise<string | null> {
  const searchRes = await wikiFetch(
    `https://www.wikidata.org/w/api.php?${new URLSearchParams({
      action: "wbsearchentities",
      search: sciName,
      language: "en",
      format: "json",
      limit: "1",
      type: "item",
      origin: "*",
    }).toString()}`,
  );
  if (!searchRes.ok) return null;
  const searchJson = (await searchRes.json()) as {
    search?: Array<{ id?: string }>;
  };
  const qid = searchJson.search?.[0]?.id;
  if (!qid) return null;

  const entityRes = await wikiFetch(
    `https://www.wikidata.org/w/api.php?${new URLSearchParams({
      action: "wbgetentities",
      ids: qid,
      props: "claims",
      format: "json",
      origin: "*",
    }).toString()}`,
  );
  if (!entityRes.ok) return null;
  const entityJson = (await entityRes.json()) as {
    entities?: Record<
      string,
      {
        claims?: {
          P18?: Array<{ mainsnak?: { datavalue?: { value?: string } } }>;
        };
      }
    >;
  };
  const filename =
    entityJson.entities?.[qid]?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
  if (!filename) return null;

  return boundAnatomyImageUrl(
    `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}`,
  );
}

export async function resolveAnatomyImageUrl(input: {
  sciName: string;
  comNameEn: string;
}): Promise<AnatomyResolveResult> {
  const sciImg = await summaryImage(input.sciName);
  if (sciImg) {
    return {
      ok: true,
      imageUrl: boundAnatomyImageUrl(sciImg),
      source: `enwiki:${input.sciName}`,
    };
  }

  const comImg = await summaryImage(input.comNameEn);
  if (comImg) {
    return {
      ok: true,
      imageUrl: boundAnatomyImageUrl(comImg),
      source: `enwiki:${input.comNameEn}`,
    };
  }

  const wdImg = await wikidataP18(input.sciName);
  if (wdImg) {
    return {
      ok: true,
      imageUrl: boundAnatomyImageUrl(wdImg),
      source: `wikidata:P18:${input.sciName}`,
    };
  }

  return {
    ok: false,
    reason: `No image via enwiki (${input.sciName} / ${input.comNameEn}) or Wikidata P18`,
  };
}

export async function downloadAnatomyBytes(
  imageUrl: string,
): Promise<{ bytes: ArrayBuffer; contentType: string } | null> {
  const res = await fetch(imageUrl, {
    headers: {
      "User-Agent": USER_AGENT,
      "Api-User-Agent": USER_AGENT,
      Accept: "image/*,*/*",
    },
    redirect: "follow",
  });
  if (!res.ok) return null;
  const contentType = res.headers.get("content-type") ?? "image/jpeg";
  if (!contentType.startsWith("image/")) return null;
  return { bytes: await res.arrayBuffer(), contentType };
}
