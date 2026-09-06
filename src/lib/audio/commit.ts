import {
  existsSync,
  mkdirSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import type { AudioManifest } from "./types";

export type AudioCommitFileSystem = {
  exists: (path: string) => boolean;
  mkdir: (path: string) => void;
  rename: (from: string, to: string) => void;
  unlink: (path: string) => void;
  write: (path: string, contents: string) => void;
};

const realFileSystem: AudioCommitFileSystem = {
  exists: existsSync,
  mkdir: (path) => mkdirSync(path, { recursive: true }),
  rename: renameSync,
  unlink: unlinkSync,
  write: (path, contents) => writeFileSync(path, contents),
};

export type CommitAudioManifestInput = {
  root: string;
  manifestPath: string;
  stagedFiles: ReadonlyMap<string, string>;
  manifest: AudioManifest;
  processId: number;
  fileSystem?: AudioCommitFileSystem;
};

/** Publish staged audio and the manifest as one recoverable commit. */
export function commitAudioManifest({
  root,
  manifestPath,
  stagedFiles,
  manifest,
  processId,
  fileSystem = realFileSystem,
}: CommitAudioManifestInput): void {
  const publishedFiles: string[] = [];
  let temporaryPath: string | undefined;

  try {
    for (const [relative, staged] of stagedFiles) {
      const destination = resolve(root, relative);
      fileSystem.mkdir(dirname(destination));
      if (fileSystem.exists(destination)) continue;
      fileSystem.rename(staged, destination);
      publishedFiles.push(destination);
    }

    temporaryPath = `${manifestPath}.tmp-${processId}`;
    fileSystem.write(
      temporaryPath,
      JSON.stringify(manifest, null, 2) + "\n",
    );
    fileSystem.rename(temporaryPath, manifestPath);
  } catch (error) {
    for (const destination of [...publishedFiles].reverse()) {
      if (fileSystem.exists(destination)) fileSystem.unlink(destination);
    }
    if (temporaryPath && fileSystem.exists(temporaryPath)) {
      fileSystem.unlink(temporaryPath);
    }
    throw error;
  }
}
