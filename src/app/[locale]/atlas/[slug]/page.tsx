import type { Metadata } from "next";
import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { loadListedSpecies } from "@/lib/guide/load-listed-species";
import { longFormForLocale, nameStackForLocale } from "@/lib/locale/species";
import { AtlasDetailView } from "./AtlasDetailView";
import { LocaleChromeBar, LocaleChromeBarFallback } from "@/components/site/LocaleChromeBar";
import { LocaleSiteFooter } from "@/components/site/LocaleSiteFooter";
import { SiteFooterFallback } from "@/components/site/SiteFooter";
import { SeasonLink } from "@/components/season/SeasonLink";
import { loadMessages } from "@/i18n/load-messages";
import type { AppLocale } from "@/i18n/routing";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const [localeRaw, t, species] = await Promise.all([
    getLocale(),
    getTranslations("AtlasDetail"),
    loadListedSpecies(slug),
  ]);
  const locale = localeRaw as AppLocale;
  if (!species) {
    return { title: t("notFound") };
  }
  const stack = nameStackForLocale(species, locale);
  const description = longFormForLocale(species, "description", locale);
  return {
    title: `${stack.primary} · ${stack.secondary[0] ?? stack.scientific}`,
    ...(description ? { description } : {}),
  };
}

async function detailChromeCopy(locale: AppLocale) {
  "use cache";
  cacheLife("max");
  const messages = await loadMessages(locale);
  return {
    backToAtlas: messages.Nav.backToAtlas,
  };
}

async function AtlasSpeciesChrome() {
  const locale = (await getLocale()) as AppLocale;
  const copy = await detailChromeCopy(locale);

  return (
    <LocaleChromeBar
      leading={
        <SeasonLink
          pathname="/atlas"
          backLabel={copy.backToAtlas}
          className="self-start"
        />
      }
    />
  );
}

async function AtlasSpeciesBody({ params }: PageProps) {
  const { slug } = await params;
  const [localeRaw, species] = await Promise.all([
    getLocale(),
    loadListedSpecies(slug),
  ]);
  if (!species) notFound();

  return (
    <AtlasDetailView
      species={species}
      locale={localeRaw as AppLocale}
    />
  );
}

export default function AtlasSpeciesPage({ params }: PageProps) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen flex-col bg-background">
        <article className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-6 py-10 md:px-8">
          <Suspense fallback={<LocaleChromeBarFallback />}>
            <AtlasSpeciesChrome />
          </Suspense>
          <Suspense fallback={<div className="min-h-[60vh]" aria-hidden />}>
            <AtlasSpeciesBody params={params} />
          </Suspense>
        </article>
        <Suspense fallback={<SiteFooterFallback />}>
          <LocaleSiteFooter />
        </Suspense>
      </div>
    </main>
  );
}
