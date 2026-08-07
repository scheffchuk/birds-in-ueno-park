import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { loadListedSpecies } from "@/lib/atlas/load-listed-species";
import { longFormForLocale, nameStackForLocale } from "@/lib/locale/species";
import { AtlasDetailView } from "@/components/atlas/AtlasDetailView";
import { BackLink } from "@/components/site/BackLink";
import { LocaleSiteFooter } from "@/components/site/LocaleSiteFooter";
import { SiteFooterFallback } from "@/components/site/SiteFooter";
import type { AppLocale } from "@/i18n/routing";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("AtlasDetail");
  const species = await loadListedSpecies(slug);
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

async function AtlasSpeciesChrome() {
  const tNav = await getTranslations("Nav");

  return (
    <BackLink
      href="/atlas"
      label={tNav("backToAtlas")}
      className="self-start"
    />
  );
}

async function AtlasSpeciesBody({ params }: PageProps) {
  const { slug } = await params;
  const locale = (await getLocale()) as AppLocale;
  const species = await loadListedSpecies(slug);
  if (!species) notFound();

  return <AtlasDetailView species={species} locale={locale} />;
}

export default function AtlasSpeciesPage({ params }: PageProps) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen flex-col bg-background">
        <article className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-6 py-10 md:px-8">
          <Suspense fallback={<div className="h-4" aria-hidden />}>
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
