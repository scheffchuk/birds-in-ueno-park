import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BackLink } from "@/components/site/BackLink";
import { LocaleSiteFooter } from "@/components/site/LocaleSiteFooter";
import { SiteFooterFallback } from "@/components/site/SiteFooter";
import { LocaleSwitcher } from "@/components/site/LocaleSwitcher";

const SECTION_IDS = ["about", "data", "art"] as const;

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const tMeta = await getTranslations({ locale, namespace: "Meta" });
  const t = await getTranslations({ locale, namespace: "About" });
  return { title: `${t("title")} · ${tMeta("title")}`, description: tMeta("description") };
}

async function AboutBody({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
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

export default function AboutPage({ params }: PageProps) {
  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <Suspense fallback={<div className="min-h-[50vh]" aria-hidden />}>
        <AboutBody params={params} />
      </Suspense>
      <Suspense fallback={<SiteFooterFallback />}>
        <LocaleSiteFooter params={params} />
      </Suspense>
    </main>
  );
}
