import type { Metadata } from "next";
import { getImageProps } from "next/image";
import { Suspense } from "react";
import { connection } from "next/server";
import { preloadQuery, preloadedQueryResult } from "convex/nextjs";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { api } from "../../../convex/_generated/api";
import { CollageClient } from "./CollageClient";
import { SiteFooter } from "@/components/site/SiteFooter";
import { LocaleSwitcher } from "@/components/site/LocaleSwitcher";
import { Link } from "@/i18n/navigation";
import { pickCollageLcpCandidate } from "@/lib/collage/lcp";
import { currentTokyoSeason } from "@/lib/collage/season";

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

async function HomeChrome({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Home");
  const tNav = await getTranslations("Nav");

  return (
    <>
      <nav className="fixed top-4 right-4 z-30 flex items-center gap-2 md:top-5 md:right-7">
        <Link
          href="/atlas"
          className="inline-flex h-8 items-center rounded-full bg-background px-3.5 font-mono text-[10px] leading-none tracking-[0.18em] text-ink uppercase shadow-(--raised)"
        >
          {tNav("atlas")}
        </Link>
        <LocaleSwitcher />
      </nav>

      <header className="flex flex-col items-center px-4 pt-16 pb-4 text-center md:pt-20">
        <h1 className="font-heading text-[clamp(22px,2.8vw,34px)] leading-none tracking-tight text-ink">
          <Link
            href="/about"
            className="transition-colors hover:text-ink-2"
          >
            {t("title")}
          </Link>
        </h1>
      </header>
    </>
  );
}

function CollageLcpPreload({ imageUrl }: { imageUrl: string }) {
  const {
    props: { src, srcSet, sizes },
  } = getImageProps({
    src: imageUrl,
    alt: "",
    width: 240,
    height: 240,
    // Approximate largest collage tile before pack measures the stage.
    sizes: "40vw",
  });

  return (
    <link
      rel="preload"
      as="image"
      href={src}
      imageSrcSet={srcSet}
      imageSizes={sizes}
      fetchPriority="high"
    />
  );
}

async function CollagePreload() {
  await connection();
  const preloaded = await preloadQuery(api.species.listForCollage);
  const species = preloadedQueryResult(preloaded);
  const lcp = pickCollageLcpCandidate(species, currentTokyoSeason());

  return (
    <>
      {lcp ? <CollageLcpPreload imageUrl={lcp.imageUrl} /> : null}
      <CollageClient preloaded={preloaded} lcpSlug={lcp?.slug ?? null} />
    </>
  );
}

export default function HomePage({ params }: PageProps) {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <div className="flex min-h-0 flex-1 flex-col">
        <Suspense
          fallback={
            <header className="flex flex-col items-center px-4 pt-16 pb-4 text-center md:pt-20">
              <div className="h-9 w-56" aria-hidden />
            </header>
          }
        >
          <HomeChrome params={params} />
        </Suspense>

        <div className="relative mx-auto min-h-[60vh] w-full max-w-325 flex-1 px-2 md:px-8">
          <Suspense fallback={null}>
            <CollagePreload />
          </Suspense>
        </div>

        <SiteFooter />
      </div>
    </main>
  );
}
