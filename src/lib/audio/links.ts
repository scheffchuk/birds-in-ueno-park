import type { AppLocale } from "@/i18n/routing";
import type { PublicWikipediaLinks } from "./types";

/** Resolve a generated Wikipedia destination without making a runtime request. */
export function wikipediaUrlForLocale(
  links: PublicWikipediaLinks | undefined,
  locale: AppLocale,
): string | undefined {
  if (!links) return undefined;
  if (locale === "ja") return links.ja || links.en;
  if (locale === "zh-tw") return links.zhTw || links.en;
  return links.en;
}
