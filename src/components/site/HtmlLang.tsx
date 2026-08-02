"use client";

import { useEffect } from "react";
import type { AppLocale } from "@/i18n/routing";

function toHtmlLang(locale: AppLocale): string {
  if (locale === "zh-tw") return "zh-Hant-TW";
  return locale;
}

export function HtmlLang({ locale }: { locale: AppLocale }) {
  useEffect(() => {
    document.documentElement.lang = toHtmlLang(locale);
  }, [locale]);

  return null;
}
