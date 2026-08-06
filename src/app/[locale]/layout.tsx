import { Suspense } from "react";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { HtmlLang } from "@/components/site/HtmlLang";
import { loadMessages } from "@/i18n/load-messages";
import { routing, type AppLocale } from "@/i18n/routing";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

function LocaleLayoutFallback() {
  return (
    <div className="flex min-h-screen flex-col bg-background" aria-hidden>
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10 md:px-8">
        <div className="mx-auto h-10 w-48" />
        <div className="min-h-[50vh]" />
      </div>
    </div>
  );
}

async function LocaleProviders({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await loadMessages(locale as AppLocale);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <HtmlLang locale={locale as AppLocale} />
      {children}
    </NextIntlClientProvider>
  );
}

export default function LocaleLayout({ children, params }: Props) {
  return (
    <Suspense fallback={<LocaleLayoutFallback />}>
      <LocaleProviders params={params}>{children}</LocaleProviders>
    </Suspense>
  );
}
