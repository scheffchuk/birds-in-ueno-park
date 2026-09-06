import { describe, expect, it } from "vitest";
import { commitAudioManifest, type AudioCommitFileSystem } from "./commit";
import type { AudioManifest } from "./types";

function fakeFileSystem(
  initial: Record<string, string>,
  failRenameTo?: string,
): AudioCommitFileSystem & { files: Map<string, string> } {
  const files = new Map(Object.entries(initial));
  return {
    files,
    exists: (path) => files.has(path),
    mkdir: () => {},
    rename: (from, to) => {
      if (to === failRenameTo) throw new Error("manifest rename failed");
      const contents = files.get(from);
      if (contents === undefined) throw new Error(`missing file: ${from}`);
      files.set(to, contents);
      files.delete(from);
    },
    unlink: (path) => {
      files.delete(path);
    },
    write: (path, contents) => {
      files.set(path, contents);
    },
  };
}

const manifest: AudioManifest = {
  version: 1,
  generatedAt: "now",
  species: [],
};

describe("commitAudioManifest", () => {
  it("rolls back newly published audio and the temporary manifest on failure", () => {
    const root = "/fixture";
    const manifestPath = "/fixture/data/audio-manifest.json";
    const temporaryPath = `${manifestPath}.tmp-42`;
    const stagedPath = "/fixture/data/audio/.staging-42/bird.mp3";
    const destination = "/fixture/data/audio/bird.mp3";
    const fileSystem = fakeFileSystem(
      {
        [manifestPath]: "old manifest",
        [stagedPath]: "audio bytes",
      },
      manifestPath,
    );

    expect(() =>
      commitAudioManifest({
        root,
        manifestPath,
        stagedFiles: new Map([["data/audio/bird.mp3", stagedPath]]),
        manifest,
        processId: 42,
        fileSystem,
      }),
    ).toThrow("manifest rename failed");

    expect(fileSystem.files.get(manifestPath)).toBe("old manifest");
    expect(fileSystem.files.has(destination)).toBe(false);
    expect(fileSystem.files.has(temporaryPath)).toBe(false);
  });
});
