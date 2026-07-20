/** Parse ADMIN_GITHUB_IDS / allowlist env (comma-separated GitHub user ids). */
export function parseGitHubAllowlist(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** True when githubId is present in the allowlist CSV. */
export function isGitHubIdAllowlisted(
  githubId: string,
  allowlistCsv: string,
): boolean {
  if (!githubId) return false;
  return parseGitHubAllowlist(allowlistCsv).includes(githubId);
}
