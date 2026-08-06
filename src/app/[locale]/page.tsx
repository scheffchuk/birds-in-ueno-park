import type { Metadata } from "next";
import { getImageProps } from "next/image";
import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { connection } from "next/server";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { CollageView } from "@/components/collage/CollageView";
import { LocaleSiteFooter } from "@/components/site/LocaleSiteFooter";
import { SiteFooterFallback } from "@/components/site/SiteFooter";
import { LocaleSwitcher } from "@/components/site/LocaleSwitcher";
import { SeasonLink } from "@/components/site/SeasonLink";
import { Link } from "@/i18n/navigation";
import { loadMessages } from "@/i18n/load-messages";
import { routing, type AppLocale } from "@/i18n/routing";
import { COLLAGE_IMAGE_SIZES } from "@/lib/collage/image";
import { loadForCollage } from "@/lib/collage/load-for-collage";
import { collagePoseUrl } from "@/lib/collage/pose";
import { selectForCollage } from "@/lib/collage/select";
import { currentTokyoSeason } from "@/lib/collage/season";
import type { SpeciesRecord } from "@/lib/collage/types";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });
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

async function HomeChrome({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    return <HomeChromeFallback />;
  }
  const copy = await homeChromeCopy(locale);

  return (
    <>
      <nav className="fixed top-4 right-4 z-30 flex items-center gap-2 md:top-5 md:right-7">
        <SeasonLink
          pathname="/atlas"
          className="inline-flex h-8 items-center rounded-full bg-background px-3.5 font-mono text-[10px] leading-none tracking-[0.18em] text-ink uppercase shadow-(--raised)"
        >
          {copy.atlas}
        </SeasonLink>
        <LocaleSwitcher />
      </nav>

      <header className="flex flex-col items-center px-4 pt-16 pb-4 text-center md:pt-20">
        <h1 className="font-heading text-[clamp(22px,2.8vw,34px)] leading-none tracking-tight text-ink">
          <Link
            href="/about"
            className="transition-colors hover:text-ink-2"
          >
            {copy.title}
          </Link>
        </h1>
      </header>
    </>
  );
}

function HomeChromeFallback() {
  return (
    <>
      <nav
        className="fixed top-4 right-4 z-30 flex h-8 items-center gap-2 md:top-5 md:right-7"
        aria-hidden
      >
        <div className="h-8 w-20 rounded-full bg-background shadow-(--raised)" />
        <div className="size-8 rounded-lg bg-paper-2 shadow-(--recess)" />
      </nav>
      <header className="flex flex-col items-center px-4 pt-16 pb-4 text-center md:pt-20">
        <div className="h-9 w-56" aria-hidden />
      </header>
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

function CollageImagePreloads({ imageUrls }: { imageUrls: string[] }) {
  return imageUrls.map((imageUrl) => {
    const {
      props: { src, srcSet, sizes },
    } = getImageProps({
      src: imageUrl,
      alt: "",
      width: 120,
      height: 120,
      sizes: COLLAGE_IMAGE_SIZES,
    });
    return (
      <link
        key={src}
        rel="preload"
        as="image"
        href={src}
        imageSrcSet={srcSet}
        imageSizes={sizes}
      />
    );
  });
}

/** Tokyo Season uses wall-clock time — keep outside the cached species fetch. */
async function CollageSeasonImagePreloads({
  species,
}: {
  species: SpeciesRecord[];
}) {
  await connection();
  const imageUrls = selectForCollage(species, currentTokyoSeason())
    .map((bird) => collagePoseUrl(bird))
    .filter((url): url is string => url !== undefined);

  return <CollageImagePreloads imageUrls={imageUrls} />;
}

async function CollageSection() {
  const species = await loadForCollage();

  return (
    <>
      <Suspense fallback={null}>
        <CollageSeasonImagePreloads species={species} />
      </Suspense>
      <CollageView species={species} />
    </>
  );
}

export default function HomePage({ params }: PageProps) {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <div className="flex min-h-0 flex-1 flex-col">
        <Suspense fallback={<HomeChromeFallback />}>
          <HomeChrome params={params} />
        </Suspense>

        <div className="relative mx-auto min-h-[60vh] w-full max-w-325 flex-1 px-2 md:px-8">
          <Suspense fallback={<CollageShellFallback />}>
            <CollageSection />
          </Suspense>
        </div>

        <Suspense fallback={<SiteFooterFallback />}>
          <LocaleSiteFooter params={params} />
        </Suspense>
      </div>
    </main>
  );
}
