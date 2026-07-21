import { describe, expect, it } from "vitest";
import { creamKeyAlpha } from "./cream-matte";

describe("creamKeyAlpha", () => {
  it("clears cream corners and keeps contrasting center", () => {
    const w = 5;
    const h = 5;
    const data = new Uint8Array(w * h * 4);
    for (let i = 0; i < w * h; i += 1) {
      const o = i * 4;
      // cream
      data[o] = 245;
      data[o + 1] = 240;
      data[o + 2] = 225;
      data[o + 3] = 255;
    }
    // dark bird pixel in center
    const c = (2 * w + 2) * 4;
    data[c] = 30;
    data[c + 1] = 40;
    data[c + 2] = 50;
    data[c + 3] = 255;

    const alpha = creamKeyAlpha(data, w, h, 4, { threshold: 40, soft: 20 });
    expect(alpha[0]).toBe(0);
    expect(alpha[2 * w + 2]).toBe(255);
  });
});
