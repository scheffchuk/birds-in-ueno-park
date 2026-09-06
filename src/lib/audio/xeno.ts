/** Build the tagged v3 query required to search one scientific species name. */
export function xenoCantoQueryForSpecies(scientificName: string): string {
  const [genus, specificEpithet] = scientificName.trim().split(/\s+/);
  if (!genus || !specificEpithet) {
    throw new Error(`Expected a binomial scientific name: ${scientificName}`);
  }
  return `gen:${genus} sp:${specificEpithet}`;
}

export type RetryForbiddenOptions = {
  attempts?: number;
  baseDelayMs?: number;
  sleep?: (delayMs: number) => Promise<void>;
};

/** Retry transient Xeno-canto 403 responses without retrying authentication failures. */
export async function retryForbiddenRequest(
  request: () => Promise<Response>,
  options: RetryForbiddenOptions = {},
): Promise<Response> {
  const attempts = options.attempts ?? 6;
  const baseDelayMs = options.baseDelayMs ?? 2_000;
  const sleep = options.sleep ?? ((delayMs) => new Promise((resolve) => setTimeout(resolve, delayMs)));

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const response = await request();
    if (response.status !== 403 || attempt === attempts - 1) return response;

    const retryAfterHeader = response.headers.get("retry-after");
    const retryAfter = retryAfterHeader === null ? Number.NaN : Number(retryAfterHeader);
    const delayMs = Number.isFinite(retryAfter)
      ? Math.max(baseDelayMs, retryAfter * 1_000)
      : baseDelayMs * 2 ** attempt;
    await sleep(delayMs);
  }

  throw new Error("Xeno-canto request retry loop ended unexpectedly");
}
