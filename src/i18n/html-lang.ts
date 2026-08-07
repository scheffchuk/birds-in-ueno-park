import type { AppLocale } from "./routing";

/** BCP-47 value for `<html lang>` from an App Locale. */
export function toHtmlLang(locale: AppLocale): string {
  if (locale === "zh-tw") return "zh-Hant-TW";
  return locale;
}
