import { defineRouting } from "next-intl/routing";

export const locales = ["ja", "en", "zh-tw"] as const;
export type AppLocale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: "ja",
  localePrefix: "always",
  localeDetection: true,
  localeCookie: false,
});
