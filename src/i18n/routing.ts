import { defineRouting } from "next-intl/routing";

export const locales = ["ja", "en", "zh-TW"] as const;
export type AppLocale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: "ja",
  localePrefix: {
    mode: "always",
    prefixes: {
      "zh-TW": "/zh-tw",
    },
  },
  localeDetection: true,
  localeCookie: false,
});
