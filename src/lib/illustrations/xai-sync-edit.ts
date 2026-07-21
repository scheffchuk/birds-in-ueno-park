export type XaiImageEditInput = {
  prompt: string;
  /** Public HTTPS image URLs (anatomy, style, …). */
  imageUrls: string[];
  model?: string;
};

export type XaiImageEditResult = {
  imageUrl: string;
};

/**
 * Sync xAI image edit. Batchwork cannot run grok-imagine-image* — xAI rejects
 * those models for batch processing — so Generate uses this path instead.
 */
export async function xaiImageEdit(
  input: XaiImageEditInput,
  opts: { apiKey: string; fetchFn?: typeof fetch } = {
    apiKey: "",
  },
): Promise<XaiImageEditResult> {
  const apiKey = opts.apiKey;
  if (!apiKey) throw new Error("XAI_API_KEY required");
  const fetchFn = opts.fetchFn ?? fetch;
  const model = input.model ?? "grok-imagine-image-quality";

  const res = await fetchFn("https://api.x.ai/v1/images/edits", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt: input.prompt,
      // API accepts URL strings (not {url,type} maps) for multi-image edit.
      image: input.imageUrls,
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`xAI images/edits ${res.status}: ${text.slice(0, 400)}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    throw new Error(`xAI images/edits returned non-JSON: ${text.slice(0, 200)}`);
  }

  const url = extractImageUrl(parsed);
  if (!url) {
    throw new Error(`xAI images/edits missing image URL: ${text.slice(0, 200)}`);
  }
  return { imageUrl: url };
}

function extractImageUrl(parsed: unknown): string | undefined {
  if (typeof parsed !== "object" || parsed === null) return undefined;
  if (!("data" in parsed) || !Array.isArray(parsed.data)) return undefined;
  const first = parsed.data[0];
  if (typeof first !== "object" || first === null) return undefined;
  if (!("url" in first) || typeof first.url !== "string") return undefined;
  return first.url;
}

/** Run async work with a fixed concurrency cap. */
export async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from(
    { length: Math.min(Math.max(1, concurrency), items.length || 1) },
    async () => {
      while (next < items.length) {
        const index = next;
        next += 1;
        results[index] = await fn(items[index]!, index);
      }
    },
  );
  await Promise.all(workers);
  return results;
}
