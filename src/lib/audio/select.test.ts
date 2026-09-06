import { describe, expect, it } from "vitest";
import {
  catalogueUrlFor,
  eligibleRecordings,
  selectRecording,
  sourceUrlFor,
} from "./select";

function recording(
  overrides: Record<string, unknown> = {},
) {
  return {
    id: "100",
    gen: "Passer",
    sp: "montanus",
    type: "song",
    q: "A",
    length: "0:24",
    "file-name": "XC100.mp3",
    lic: "https://creativecommons.org/licenses/by/4.0/",
    rec: "A. Recordist",
    url: "https://xeno-canto.org/100/download",
    ...overrides,
  } as const;
}

describe("selectRecording", () => {
  it("matches the exact scientific name and rejects questionable or unsupported results", () => {
    const eligible = eligibleRecordings("Passer montanus", [
      recording({ id: "1", sp: "domesticus" }),
      recording({ id: "2", rmk: "possibly a background species" }),
      recording({ id: "3", lic: "https://example.com/custom-license" }),
      recording({ id: "4", "bird-seen": "unknown" }),
      recording({ id: "6", background: ["Corvus corone"] }),
      recording({ id: "5" }),
    ]);

    expect(eligible).toHaveLength(1);
    expect(eligible[0]?.recording.id).toBe("5");
  });

  it("prefers a song, then a call, short recordings, quality, and catalogue number", () => {
    const chosen = selectRecording("Passer montanus", [
      recording({ id: "20", type: "call", q: "A" }),
      recording({ id: "30", type: "song", q: "C" }),
      recording({ id: "10", type: "song", q: "A" }),
      recording({ id: "5", type: "song", q: "A", length: "1:30" }),
    ]);

    expect(chosen?.recording.id).toBe("10");
  });

  it("uses duration before quality within the preferred song pool", () => {
    const chosen = selectRecording("Passer montanus", [
      recording({ id: "40", length: "0:20", q: "B" }),
      recording({ id: "41", length: "0:30", q: "A" }),
    ]);

    expect(chosen?.recording.id).toBe("40");
  });

  it("chooses the shortest eligible recording when none is under 90 seconds", () => {
    const chosen = selectRecording("Passer montanus", [
      recording({ id: "20", length: "2:00", type: "song", q: "A" }),
      recording({ id: "10", length: "1:31", type: "call", q: "E" }),
      recording({ id: "30", length: "3:00", type: "song", q: "A" }),
    ]);

    expect(chosen?.recording.id).toBe("10");
  });

  it("preserves the exact licence URL and flags noncommercial licences", () => {
    const chosen = selectRecording("Passer montanus", [
      recording({
        lic: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
      }),
    ]);

    expect(chosen).toMatchObject({
      license: "CC BY-NC-SA",
      licenseUrl: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
      nonCommercial: true,
    });
  });

  it.each([
    ["https://creativecommons.org/publicdomain/zero/1.0/", "CC0", false],
    ["https://creativecommons.org/licenses/by/4.0/", "CC BY", false],
    ["https://creativecommons.org/licenses/by-sa/4.0/", "CC BY-SA", false],
    ["https://creativecommons.org/licenses/by-nc/4.0/", "CC BY-NC", true],
    [
      "https://creativecommons.org/licenses/by-nc-sa/4.0/",
      "CC BY-NC-SA",
      true,
    ],
    [
      "https://creativecommons.org/licenses/by-nc-nd/4.0/",
      "CC BY-NC-ND",
      true,
    ],
  ])("accepts %s as %s", (licenseUrl, license, nonCommercial) => {
    expect(
      selectRecording("Passer montanus", [recording({ lic: licenseUrl })]),
    ).toMatchObject({ licenseUrl, license, nonCommercial });
  });

  it("keeps the catalogue provenance URL separate from the download URL", () => {
    const selected = recording({ id: "123", file: "https://cdn.example/bird.mp3" });

    expect(selectRecording("Passer montanus", [selected])).toBeDefined();
    expect(sourceUrlFor(selected)).toBe("https://cdn.example/bird.mp3");
    expect(catalogueUrlFor(selected)).toBe("https://xeno-canto.org/123");
  });

  it("rejects recordings without an original filename", () => {
    expect(
      selectRecording("Passer montanus", [
        recording({ "file-name": undefined }),
      ]),
    ).toBeUndefined();
  });
});
