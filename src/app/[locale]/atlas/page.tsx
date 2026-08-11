import type { Metadata } from "next";
import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { AtlasListView } from "@/components/atlas/AtlasListView";
import { LocaleChromeBar, LocaleChromeBarFallback } from "@/components/site/LocaleChromeBar";
import { LocaleSiteFooter } from "@/components/site/LocaleSiteFooter";
import { SiteFooterFallback } from "@/components/site/SiteFooter";
import { SeasonLink } from "@/components/season/SeasonLink";
import { loadMessages } from "@/i18n/load-messages";
import type { AppLocale } from "@/i18n/routing";
import { loadAtlasList } from "@/lib/guide/load-atlas-list";

export async function generateMetadata(): Promise<Metadata> {
  const tMeta = await getTranslations("Meta");
  const t = await getTranslations("Atlas");
  const tSeason = await getTranslations("Season");
  return {
    title: `${t("title")} · ${tMeta("title")}`,
    description: t("subtitle", { season: tSeason("all") }),
  };
}

async function atlasChromeCopy(locale: AppLocale) {
  "use cache";
  cacheLife("max");
  const messages = await loadMessages(locale);
  return {
    title: messages.Atlas.title,
    backToCollage: messages.Nav.backToCollage,
  };
}

async function AtlasChrome() {
  const locale = (await getLocale()) as AppLocale;
  const copy = await atlasChromeCopy(locale);

  return (
    <header className="flex flex-col gap-5">
      <LocaleChromeBar
        leading={
          <SeasonLink pathname="/" backLabel={copy.backToCollage} />
        }
      />
      <div className="flex flex-col gap-1 text-center">
        <h1 className="font-heading text-[clamp(22px,2.8vw,34px)] leading-none tracking-tight text-ink">
          {copy.title}
        </h1>
      </div>
    </header>
  );
}

function AtlasChromeFallback() {
  return (
    <header className="flex flex-col gap-5">
      <LocaleChromeBarFallback />
      <div className="h-9" aria-hidden />
    </header>
  );
}

async function AtlasListSection() {
  const species = await loadAtlasList();
  return <AtlasListView species={species} />;
}

function AtlasListFallback() {
  return <div className="min-h-[50vh]" aria-hidden />;
}

export default function AtlasPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen flex-col bg-background">
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-2 px-6 py-10 md:px-8">
          <Suspense fallback={<AtlasChromeFallback />}>
            <AtlasChrome />
          </Suspense>

          <Suspense fallback={<AtlasListFallback />}>
            <AtlasListSection />
          </Suspense>
        </div>
        <Suspense fallback={<SiteFooterFallback />}>
          <LocaleSiteFooter />
        </Suspense>
      </div>
    </main>
  );
}
