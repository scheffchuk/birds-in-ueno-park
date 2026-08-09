import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { RootShell } from "@/components/site/RootShell";
import { toHtmlLang } from "@/i18n/html-lang";
import { routing, type AppLocale } from "@/i18n/routing";

export const metadata: Metadata = {
  title: "Birds in Ueno",
  description:
    "A curated bird guide for Ueno Park and Shinobazu Pond — collage sized by seasonal Prevalence.",
  appleWebApp: {
    title: "Birds in Ueno",
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = (await getLocale()) as AppLocale;
  const messages = await getMessages();

  return (
    <RootShell lang={toHtmlLang(locale)}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </RootShell>
  );
}
