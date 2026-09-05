import { describe, expect, it } from "vitest";
import guideSpecies from "../../../data/guide-species.json";
import audioManifestData from "../../../data/audio-manifest.json";
import { assertManifestCoverage } from "./generator";
import type { AudioManifest, GuideSpeciesForAudio } from "./types";

describe("committed audio manifest", () => {
  it("has one explicit entry for every current Guide species", () => {
    const guide = guideSpecies as GuideSpeciesForAudio[];
    const manifest = audioManifestData as AudioManifest;

    expect(guide).toHaveLength(68);
    expect(() => assertManifestCoverage(manifest, guide)).not.toThrow();
    expect(manifest.species.every((entry) => entry.audio.status)).toBe(true);
  });
});
