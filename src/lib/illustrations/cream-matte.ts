/**
 * Cream-ground chroma key for kachō-e outputs when fal is unavailable.
 * Samples corner colors and drops near-background pixels.
 */
export type CreamMatteOptions = {
  /** Max Euclidean RGB distance from sampled cream to treat as background. */
  threshold?: number;
  /** Soft falloff past threshold (alpha ramp). */
  soft?: number;
};

function sampleCornerRgb(
  data: Uint8Array,
  width: number,
  height: number,
  channels: number,
): { r: number; g: number; b: number } {
  const pts = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
    [Math.floor(width / 2), 0],
    [0, Math.floor(height / 2)],
  ] as const;
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (const [x, y] of pts) {
    if (x < 0 || y < 0 || x >= width || y >= height) continue;
    const i = (y * width + x) * channels;
    r += data[i] ?? 0;
    g += data[i + 1] ?? 0;
    b += data[i + 2] ?? 0;
    n += 1;
  }
  if (n === 0) return { r: 245, g: 240, b: 225 };
  return { r: r / n, g: g / n, b: b / n };
}

export function creamKeyAlpha(
  data: Uint8Array,
  width: number,
  height: number,
  channels: number,
  opts: CreamMatteOptions = {},
): Uint8Array {
  const threshold = opts.threshold ?? 48;
  const soft = opts.soft ?? 28;
  const cream = sampleCornerRgb(data, width, height, channels);
  const alpha = new Uint8Array(width * height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * channels;
      const dr = (data[i] ?? 0) - cream.r;
      const dg = (data[i + 1] ?? 0) - cream.g;
      const db = (data[i + 2] ?? 0) - cream.b;
      const dist = Math.sqrt(dr * dr + dg * dg + db * db);
      let a: number;
      if (dist <= threshold) a = 0;
      else if (dist >= threshold + soft) a = 255;
      else a = Math.round(((dist - threshold) / soft) * 255);
      // Keep existing alpha if present and more transparent.
      if (channels >= 4) {
        const existing = data[i + 3] ?? 255;
        a = Math.min(a, existing);
      }
      alpha[y * width + x] = a;
    }
  }
  return alpha;
}

/** Apply cream-key alpha onto RGBA buffer (mutates a copy). */
export function applyCreamKeyRgba(
  data: Uint8Array,
  width: number,
  height: number,
  opts?: CreamMatteOptions,
): Uint8Array {
  const out = new Uint8Array(width * height * 4);
  const alpha = creamKeyAlpha(data, width, height, 4, opts);
  for (let i = 0; i < width * height; i += 1) {
    const si = i * 4;
    out[si] = data[si] ?? 0;
    out[si + 1] = data[si + 1] ?? 0;
    out[si + 2] = data[si + 2] ?? 0;
    out[si + 3] = alpha[i] ?? 0;
  }
  return out;
}
