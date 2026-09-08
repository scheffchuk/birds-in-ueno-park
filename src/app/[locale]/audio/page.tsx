import type { Metadata } from "next";
import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowLeftIcon } from "lucide-react";
import { AudioCredits } from "@/components/site/AudioCredits";
import {
  LocaleChromeBar,
  LocaleChromeBarFallback,
} from "@/components/site/LocaleChromeBar";
import { LocaleSiteFooter } from "@/components/site/LocaleSiteFooter";
import { SiteFooterFallback } from "@/components/site/SiteFooter";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { loadMessages } from "@/i18n/load-messages";
import type { AppLocale } from "@/i18n/routing";
import audioManifestData from "../../../../data/audio-manifest.json";
import { audioCreditsForManifest } from "@/lib/audio/credits";
import type { AudioManifest } from "@/lib/audio/types";
import { cn } from "@/lib/utils";

const audioManifest = audioManifestData as AudioManifest;
const audioCredits = audioCreditsForManifest(audioManifest);

export async function generateMetadata(): Promise<Metadata> {
  const tMeta = await getTranslations("Meta");
  const t = await getTranslations("Audio");
  return {
    title: `${t("title")} · ${tMeta("title")}`,
    description: t("body"),
  };
}

async function audioChromeCopy(locale: AppLocale) {
  "use cache";
  cacheLife("max");
  const messages = await loadMessages(locale);
  return {
    backToAbout: messages.Nav.about,
  };
}

async function AudioChrome() {
  const locale = (await getLocale()) as AppLocale;
  const copy = await audioChromeCopy(locale);

  return (
    <LocaleChromeBar
      leading={
        <Link
          href="/about"
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon" }),
            "text-ink-soft hover:text-ink",
          )}
          aria-label={copy.backToAbout}
        >
          <ArrowLeftIcon />
        </Link>
      }
    />
  );
}

async function AudioBody() {
  const [localeRaw, t] = await Promise.all([
    getLocale(),
    getTranslations("Audio"),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <h1 className="font-heading text-[clamp(26px,4vw,42px)] leading-none tracking-tight text-ink">
          {t("title")}
        </h1>
        <p className="text-base leading-relaxed text-ink-2">{t("body")}</p>
      </header>
      <AudioCredits
        locale={localeRaw as AppLocale}
        credits={audioCredits}
        labels={{
          recordist: t("recordist"),
          catalogue: t("catalogue"),
          source: t("source"),
          license: t("license"),
          none: t("none"),
        }}
      />
    </div>
  );
}

export default function AudioPage() {
  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <article className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-6 py-12 md:px-8">
        <Suspense fallback={<LocaleChromeBarFallback />}>
          <AudioChrome />
        </Suspense>
        <Suspense fallback={<div className="min-h-[40vh]" aria-hidden />}>
          <AudioBody />
        </Suspense>
      </article>
      <Suspense fallback={<SiteFooterFallback />}>
        <LocaleSiteFooter />
      </Suspense>
    </main>
  );
}
