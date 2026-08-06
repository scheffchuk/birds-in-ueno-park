import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { getLocale, getTranslations } from "next-intl/server";
import { loadAtlasList } from "@/lib/atlas/load-atlas-list";
import { selectForAtlas } from "@/lib/atlas/select";
import {
  parseSeasonSearchParam,
  readSeasonSearchParam,
} from "@/lib/collage/season";
import { commonNameForLocale } from "@/lib/locale/species";
import { AtlasSpeciesCard } from "@/components/atlas/AtlasSpeciesCard";
import { BackLink } from "@/components/site/BackLink";
import { LocaleSiteFooter } from "@/components/site/LocaleSiteFooter";
import { SiteFooterFallback } from "@/components/site/SiteFooter";
import { LocaleSwitcher } from "@/components/site/LocaleSwitcher";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import type { AppLocale } from "@/i18n/routing";
import { AtlasSeasonPicker } from "./AtlasSeasonPicker";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ season?: string | string[] }>;
};

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  await connection();
  const { locale } = await params;
  const { season: seasonParam } = await searchParams;
  const season = parseSeasonSearchParam(seasonParam);
  const tMeta = await getTranslations({ locale, namespace: "Meta" });
  const t = await getTranslations({ locale, namespace: "Atlas" });
  const tSeason = await getTranslations({ locale, namespace: "Season" });
  return {
    title: `${t("title")} · ${tMeta("title")}`,
    description: t("subtitle", { season: tSeason(season) }),
  };
}

async function AtlasSubtitle({
  searchParams,
}: {
  searchParams: PageProps["searchParams"];
}) {
  await connection();
  const { season: seasonParam } = await searchParams;
  const season = parseSeasonSearchParam(seasonParam);
  const t = await getTranslations("Atlas");
  const tSeason = await getTranslations("Season");

  return (
    <p className="text-sm text-ink-soft">
      {t("subtitle", { season: tSeason(season) })}
    </p>
  );
}

async function AtlasBackToCollage({
  searchParams,
}: {
  searchParams: PageProps["searchParams"];
}) {
  await connection();
  const tNav = await getTranslations("Nav");
  const { season: seasonParam } = await searchParams;
  return (
    <BackLink
      href="/"
      label={tNav("backToCollage")}
      season={readSeasonSearchParam(seasonParam)}
    />
  );
}

async function AtlasChrome({
  searchParams,
}: {
  searchParams: PageProps["searchParams"];
}) {
  const t = await getTranslations("Atlas");
  const tNav = await getTranslations("Nav");

  return (
    <header className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Suspense
          fallback={
            <BackLink href="/" label={tNav("backToCollage")} />
          }
        >
          <AtlasBackToCollage searchParams={searchParams} />
        </Suspense>
        <LocaleSwitcher />
      </div>
      <div className="flex flex-col gap-1 text-center">
        <h1 className="font-heading text-[clamp(22px,2.8vw,34px)] leading-none tracking-tight text-ink">
          {t("title")}
        </h1>
        <Suspense fallback={<p className="h-5 text-sm" aria-hidden />}>
          <AtlasSubtitle searchParams={searchParams} />
        </Suspense>
      </div>
    </header>
  );
}

async function AtlasSeasonBody({
  searchParams,
}: {
  searchParams: PageProps["searchParams"];
}) {
  await connection();
  const { season: seasonParam } = await searchParams;
  const season = parseSeasonSearchParam(seasonParam);
  const species = await loadAtlasList();
  const rows = selectForAtlas(species, season);
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("Atlas");

  if (rows.length === 0) {
    return (
      <Empty className="border-0 py-16">
        <EmptyHeader>
          <EmptyTitle className="font-heading text-xl">
            {t("emptyTitle")}
          </EmptyTitle>
          <EmptyDescription>{t("emptyDescription")}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
      {rows.map((row, index) => (
        <li key={row.slug}>
          <AtlasSpeciesCard
            slug={row.slug}
            comName={commonNameForLocale(row, locale)}
            sciName={row.sciName}
            imageUrl={row.imageUrl}
            index={index}
          />
        </li>
      ))}
    </ul>
  );
}

function AtlasListFallback() {
  return <div className="min-h-[50vh]" aria-hidden />;
}

export default function AtlasPage({ params, searchParams }: PageProps) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen flex-col bg-background">
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10 md:px-8">
          <AtlasChrome searchParams={searchParams} />

          <div className="flex justify-center">
            <Suspense fallback={<div className="h-10" aria-hidden />}>
              <AtlasSeasonPicker />
            </Suspense>
          </div>

          <Suspense fallback={<AtlasListFallback />}>
            <AtlasSeasonBody searchParams={searchParams} />
          </Suspense>
        </div>
        <Suspense fallback={<SiteFooterFallback />}>
          <LocaleSiteFooter params={params} />
        </Suspense>
      </div>
    </main>
  );
}
