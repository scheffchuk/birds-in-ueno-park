import type { Metadata } from "next";
import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { CollageView } from "./CollageView";
import { LocaleChromeBar } from "@/components/site/LocaleChromeBar";
import { LocaleSiteFooter } from "@/components/site/LocaleSiteFooter";
import { SiteFooterFallback } from "@/components/site/SiteFooter";
import { LocaleSwitcher } from "@/components/site/LocaleSwitcher";
import { SeasonLink } from "@/components/season/SeasonLink";
import { Link } from "@/i18n/navigation";
import { loadMessages } from "@/i18n/load-messages";
import type { AppLocale } from "@/i18n/routing";
import { loadForCollage } from "@/lib/collage/load-for-collage";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Meta");
  return { title: t("title"), description: t("description") };
}

/** Message strings only — no next-intl Link/client trees inside `use cache`. */
async function homeChromeCopy(locale: AppLocale) {
  "use cache";
  cacheLife("max");
  const messages = await loadMessages(locale);
  return {
    title: messages.Home.title,
    atlas: messages.Nav.atlas,
  };
}

async function HomeChrome() {
  const locale = (await getLocale()) as AppLocale;
  const copy = await homeChromeCopy(locale);

  return (
    <>
      <LocaleChromeBar
        className="fixed top-4 right-4 z-30 md:top-5 md:right-7"
        trailing={
          <>
            <SeasonLink
              pathname="/atlas"
              className="inline-flex h-8 items-center rounded-full bg-background px-3.5 font-mono text-[10px] leading-none tracking-[0.18em] text-ink uppercase shadow-(--raised)"
            >
              {copy.atlas}
            </SeasonLink>
            <LocaleSwitcher />
          </>
        }
      />

      <header className="fixed inset-x-0 top-0 z-20 flex flex-col items-center px-4 pt-16 pb-4 text-center md:pt-20">
        <h1 className="font-heading text-[clamp(22px,2.8vw,34px)] leading-none tracking-tight text-ink">
          <Link
            href="/about"
            className="transition-colors hover:text-ink-2"
          >
            {copy.title}
          </Link>
        </h1>
      </header>
      <div className="h-28 shrink-0 md:h-32" aria-hidden />
    </>
  );
}

function HomeChromeFallback() {
  return (
    <>
      <div
        className="fixed top-4 right-4 z-30 flex items-center gap-2 md:top-5 md:right-7"
        aria-hidden
      >
        <div className="h-8 w-20 rounded-full bg-background shadow-(--raised)" />
        <div className="size-8 rounded-lg bg-paper-2 shadow-(--recess)" />
      </div>
      <header className="fixed inset-x-0 top-0 z-20 flex flex-col items-center px-4 pt-16 pb-4 text-center md:pt-20">
        <div className="h-9 w-56" aria-hidden />
      </header>
      <div className="h-28 shrink-0 md:h-32" aria-hidden />
    </>
  );
}

function CollageShellFallback() {
  return (
    <div
      className="fixed top-4 left-4 z-30 h-8 w-52 max-w-[calc(100vw-8rem)] rounded-full bg-paper-2 shadow-(--recess) md:top-5 md:left-7"
      aria-hidden
    />
  );
}

async function CollageSection() {
  const layouts = await loadForCollage();

  return <CollageView layouts={layouts} />;
}

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <div className="flex min-h-0 flex-1 flex-col">
        <Suspense fallback={<HomeChromeFallback />}>
          <HomeChrome />
        </Suspense>

        <div className="relative mx-auto min-h-[60vh] w-full max-w-325 flex-1 px-2 md:px-8">
          <Suspense fallback={<CollageShellFallback />}>
            <CollageSection />
          </Suspense>
        </div>

        <Suspense fallback={<SiteFooterFallback />}>
          <LocaleSiteFooter />
        </Suspense>
      </div>
    </main>
  );
}
