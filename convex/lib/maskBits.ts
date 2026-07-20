const DIM_MAX = 560;
const MASK_MAX = 93;
const ALPHA_ON = 127;

/** Scale cutout so the long side is 560 (collage aspect). */
export function scaleDims(width: number, height: number): number[] {
  const long = Math.max(width, height);
  const scale = long > 0 ? DIM_MAX / long : 1;
  return [Math.round(width * scale), Math.round(height * scale)];
}

/**
 * Pack alpha channel into 1-bit MSB-first row-major base64 mask.
 * Downscales so the long side is <= 93.
 */
export function packMaskBits(
  alpha: Uint8Array,
  width: number,
  height: number,
): { w: number; h: number; bits: string } {
  const scale = Math.min(1, MASK_MAX / Math.max(width, height));
  const mw = Math.max(1, Math.round(width * scale));
  const mh = Math.max(1, Math.round(height * scale));

  // Nearest-neighbor downsample of alpha into mw×mh
  const down = new Uint8Array(mw * mh);
  for (let y = 0; y < mh; y += 1) {
    const sy = Math.min(height - 1, Math.floor((y + 0.5) * (height / mh)));
    for (let x = 0; x < mw; x += 1) {
      const sx = Math.min(width - 1, Math.floor((x + 0.5) * (width / mw)));
      down[y * mw + x] = alpha[sy * width + sx] ?? 0;
    }
  }

  const bits = new Uint8Array(Math.ceil((mw * mh) / 8));
  for (let i = 0; i < down.length; i += 1) {
    if ((down[i] ?? 0) > ALPHA_ON) {
      bits[i >> 3]! |= 1 << (7 - (i & 7));
    }
  }

  let binary = "";
  for (const byte of bits) binary += String.fromCharCode(byte);
  return { w: mw, h: mh, bits: btoa(binary) };
}

export { DIM_MAX, MASK_MAX, ALPHA_ON };
