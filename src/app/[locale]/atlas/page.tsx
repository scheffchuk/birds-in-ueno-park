import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { AtlasListView } from "@/components/atlas/AtlasListView";
import { LocaleSiteFooter } from "@/components/site/LocaleSiteFooter";
import { SiteFooterFallback } from "@/components/site/SiteFooter";
import { LocaleSwitcher } from "@/components/site/LocaleSwitcher";
import { SeasonLink } from "@/components/site/SeasonLink";
import { loadAtlasList } from "@/lib/atlas/load-atlas-list";

export async function generateMetadata(): Promise<Metadata> {
  const tMeta = await getTranslations("Meta");
  const t = await getTranslations("Atlas");
  const tSeason = await getTranslations("Season");
  return {
    title: `${t("title")} · ${tMeta("title")}`,
    description: t("subtitle", { season: tSeason("all") }),
  };
}

async function AtlasChrome() {
  const t = await getTranslations("Atlas");
  const tNav = await getTranslations("Nav");

  return (
    <header className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Suspense fallback={<div className="size-8" aria-hidden />}>
          <SeasonLink pathname="/" backLabel={tNav("backToCollage")} />
        </Suspense>
        <LocaleSwitcher />
      </div>
      <div className="flex flex-col gap-1 text-center">
        <h1 className="font-heading text-[clamp(22px,2.8vw,34px)] leading-none tracking-tight text-ink">
          {t("title")}
        </h1>
      </div>
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
          <Suspense fallback={<div className="h-24" aria-hidden />}>
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
