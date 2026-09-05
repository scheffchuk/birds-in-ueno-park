import type { Metadata } from "next";
import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { LocaleChromeBar, LocaleChromeBarFallback } from "@/components/site/LocaleChromeBar";
import { LocaleSiteFooter } from "@/components/site/LocaleSiteFooter";
import { SiteFooterFallback } from "@/components/site/SiteFooter";
import { SeasonLink } from "@/components/season/SeasonLink";
import { loadMessages } from "@/i18n/load-messages";
import type { AppLocale } from "@/i18n/routing";
import audioManifestData from "../../../../data/audio-manifest.json";
import { commonNameForLocale } from "@/lib/locale/species";
import type { AudioManifest } from "@/lib/audio/types";

const audioManifest = audioManifestData as AudioManifest;

const SECTION_IDS = ["about", "data", "art", "audio"] as const;

function AudioCredits({ locale, labels }: { locale: AppLocale; labels: {
  recordist: string;
  catalogue: string;
  source: string;
  license: string;
  none: string;
} }) {
  const entries = audioManifest.species.filter(
    (entry) => entry.audio.status === "available",
  );
  if (entries.length === 0) {
    return <p className="text-sm text-ink-soft">{labels.none}</p>;
  }

  return (
    <ol className="flex flex-col gap-5">
      {entries.map((entry) => {
        if (entry.audio.status !== "available") return null;
        return (
          <li key={entry.slug} className="border-t border-hairline pt-4 first:border-t-0 first:pt-0">
            <h3 className="font-heading text-lg text-ink">
              {commonNameForLocale(entry, locale)}
            </h3>
            <p className="text-sm text-ink-soft italic">{entry.sciName}</p>
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm text-ink-2">
              <dt>{labels.recordist}</dt>
              <dd>{entry.audio.recordist}</dd>
              <dt>{labels.catalogue}</dt>
              <dd>{entry.audio.catalogueNumber}</dd>
              <dt>{labels.source}</dt>
              <dd>
                <a
                  href={entry.audio.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 hover:text-ink"
                >
                  xeno-canto #{entry.audio.catalogueNumber}
                </a>
              </dd>
              <dt>{labels.license}</dt>
              <dd>
                <a
                  href={entry.audio.licenseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 hover:text-ink"
                >
                  {entry.audio.license}
                </a>
              </dd>
            </dl>
          </li>
        );
      })}
    </ol>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const tMeta = await getTranslations("Meta");
  const t = await getTranslations("About");
  return {
    title: `${t("title")} · ${tMeta("title")}`,
    description: tMeta("description"),
  };
}

async function aboutChromeCopy(locale: AppLocale) {
  "use cache";
  cacheLife("max");
  const messages = await loadMessages(locale);
  return {
    backToCollage: messages.Nav.backToCollage,
  };
}

async function AboutChrome() {
  const locale = (await getLocale()) as AppLocale;
  const copy = await aboutChromeCopy(locale);

  return (
    <LocaleChromeBar
      leading={
        <SeasonLink pathname="/" backLabel={copy.backToCollage} />
      }
    />
  );
}

async function AboutBody() {
  const t = await getTranslations("About");
  const locale = (await getLocale()) as AppLocale;

  return (
    <>
      {SECTION_IDS.map((id) => (
        <section key={id} id={id} className="flex scroll-mt-6 flex-col gap-4">
          <h2 className="font-heading text-xl tracking-wide text-ink">
            {t(`sections.${id}.title`)}
          </h2>
          <p className="text-base leading-relaxed text-ink-2">
            {t(`sections.${id}.body`)}
          </p>
          {id === "audio" ? (
            <AudioCredits
              locale={locale}
              labels={{
                recordist: t("sections.audio.recordist"),
                catalogue: t("sections.audio.catalogue"),
                source: t("sections.audio.source"),
                license: t("sections.audio.license"),
                none: t("sections.audio.none"),
              }}
            />
          ) : null}
        </section>
      ))}
    </>
  );
}

export default function AboutPage() {
  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <article className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-12 px-6 py-12 md:px-8">
        <Suspense fallback={<LocaleChromeBarFallback />}>
          <AboutChrome />
        </Suspense>
        <Suspense fallback={<div className="min-h-[40vh]" aria-hidden />}>
          <AboutBody />
        </Suspense>
      </article>
      <Suspense fallback={<SiteFooterFallback />}>
        <LocaleSiteFooter />
      </Suspense>
    </main>
  );
}
