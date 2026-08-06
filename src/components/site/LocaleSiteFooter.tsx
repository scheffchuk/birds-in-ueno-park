import { hasLocale } from "next-intl";
import { SiteFooter, SiteFooterFallback } from "@/components/site/SiteFooter";
import { routing, type AppLocale } from "@/i18n/routing";

type Props = {
  params: Promise<{ locale: string }>;
};

/** Resolves `[locale]` then renders the cached footer (params stay in a Suspense hole). */
export async function LocaleSiteFooter({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    return <SiteFooterFallback />;
  }
  return <SiteFooter locale={locale as AppLocale} />;
}
