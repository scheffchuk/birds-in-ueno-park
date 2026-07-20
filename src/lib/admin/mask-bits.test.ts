import { describe, expect, it } from "vitest";
import { packMaskBits, scaleDims } from "./mask-bits";

describe("scaleDims", () => {
  it("scales the long side to 560", () => {
    expect(scaleDims(1120, 800)).toEqual([560, 400]);
    expect(scaleDims(400, 800)).toEqual([280, 560]);
  });
});

describe("packMaskBits", () => {
  it("packs opaque alpha as MSB-first row-major base64", () => {
    // 8x1 all opaque → one byte 0xff → "/w=="
    const alpha = new Uint8Array(8).fill(255);
    expect(packMaskBits(alpha, 8, 1)).toEqual({ w: 8, h: 1, bits: "/w==" });
  });

  it("treats alpha <= 127 as transparent", () => {
    const alpha = new Uint8Array([200, 100, 0, 255, 0, 0, 0, 0]);
    const packed = packMaskBits(alpha, 8, 1);
    expect(packed.w).toBe(8);
    expect(packed.h).toBe(1);
    // bits: 1 0 0 1 0 0 0 0 → 0b10010000 = 0x90 → base64 "kA=="
    expect(packed.bits).toBe("kA==");
  });
});
