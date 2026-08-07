import { getLocale } from "next-intl/server";
import { SiteFooter } from "@/components/site/SiteFooter";
import type { AppLocale } from "@/i18n/routing";

/** Footer for Locale routes — Locale from next-intl / root params. */
export async function LocaleSiteFooter() {
  const locale = (await getLocale()) as AppLocale;
  return <SiteFooter locale={locale} />;
}
