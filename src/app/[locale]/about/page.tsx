import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { BackLink } from "@/components/site/BackLink";
import { LocaleSiteFooter } from "@/components/site/LocaleSiteFooter";
import { SiteFooterFallback } from "@/components/site/SiteFooter";
import { LocaleSwitcher } from "@/components/site/LocaleSwitcher";

const SECTION_IDS = ["about", "data", "art"] as const;

export async function generateMetadata(): Promise<Metadata> {
  const tMeta = await getTranslations("Meta");
  const t = await getTranslations("About");
  return {
    title: `${t("title")} · ${tMeta("title")}`,
    description: tMeta("description"),
  };
}

async function AboutBody() {
  const t = await getTranslations("About");
  const tNav = await getTranslations("Nav");

  return (
    <article className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-12 px-6 py-12 md:px-8">
      <header className="flex w-full flex-wrap items-center justify-between gap-3">
        <BackLink href="/" label={tNav("backToCollage")} />
        <LocaleSwitcher />
      </header>

      {SECTION_IDS.map((id) => (
        <section key={id} className="flex flex-col gap-4">
          <h2 className="font-heading text-xl tracking-wide text-ink">
            {t(`sections.${id}.title`)}
          </h2>
          <p className="text-base leading-relaxed text-ink-2">
            {t(`sections.${id}.body`)}
          </p>
        </section>
      ))}
    </article>
  );
}

export default function AboutPage() {
  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <Suspense fallback={<div className="min-h-[50vh]" aria-hidden />}>
        <AboutBody />
      </Suspense>
      <Suspense fallback={<SiteFooterFallback />}>
        <LocaleSiteFooter />
      </Suspense>
    </main>
  );
}
