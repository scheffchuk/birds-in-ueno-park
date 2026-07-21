/**
 * Keep anatomy refs well under Convex HTTP action response limits (~20MB)
 * and cheap for xAI to fetch.
 */
export const ANATOMY_MAX_EDGE = 1600;
export const ANATOMY_MAX_BYTES = 2_500_000;

/** Prefer a width-bounded Wikimedia URL when we can rewrite it. */
export function boundAnatomyImageUrl(
  imageUrl: string,
  maxWidth = ANATOMY_MAX_EDGE,
): string {
  try {
    const u = new URL(imageUrl);
    if (
      u.hostname.endsWith("wikimedia.org") &&
      u.pathname.includes("Special:FilePath")
    ) {
      u.searchParams.set("width", String(maxWidth));
      return u.toString();
    }

    if (u.hostname === "upload.wikimedia.org") {
      const direct = u.pathname.match(
        /^\/wikipedia\/([^/]+)\/([0-9a-f])\/([0-9a-f]{2})\/([^/]+)$/i,
      );
      if (direct) {
        const [, project, a, ab, file] = direct;
        return `https://upload.wikimedia.org/wikipedia/${project}/thumb/${a}/${ab}/${file}/${maxWidth}px-${file}`;
      }

      const thumb = u.pathname.match(
        /^\/wikipedia\/([^/]+)\/thumb\/([0-9a-f])\/([0-9a-f]{2})\/([^/]+)\/\d+px-(.+)$/i,
      );
      if (thumb) {
        const [, project, a, ab, file] = thumb;
        return `https://upload.wikimedia.org/wikipedia/${project}/thumb/${a}/${ab}/${file}/${maxWidth}px-${file}`;
      }
    }

    return imageUrl;
  } catch {
    return imageUrl;
  }
}
