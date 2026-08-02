import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { preloadQuery } from "convex/nextjs";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { api } from "../../../convex/_generated/api";
import { CollageClient } from "./CollageClient";
import { SiteFooter } from "@/components/site/SiteFooter";
import { LocaleSwitcher } from "@/components/site/LocaleSwitcher";
import { Link } from "@/i18n/navigation";

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

      <header className="flex flex-col items-center gap-1.5 px-4 pt-14 pb-3 text-center md:pt-16 md:pb-4">
        <Link
          href="/about"
          className="font-heading text-sm tracking-wide text-ink-2 italic transition-colors hover:text-ink md:text-base"
        >
          {t("place")}
        </Link>
        <h1 className="font-heading text-[clamp(24px,3.2vw,40px)] leading-none tracking-tight text-ink">
          {t("title")}
        </h1>
      </header>
    </>
  );
}

async function CollagePreload() {
  await connection();
  const preloaded = await preloadQuery(api.species.listForCollage);
  return <CollageClient preloaded={preloaded} />;
}

export default function HomePage({ params }: PageProps) {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <div className="flex min-h-0 flex-1 flex-col">
        <Suspense
          fallback={
            <header className="flex flex-col items-center gap-1.5 px-4 pt-14 pb-3 text-center md:pt-16 md:pb-4">
              <div className="h-5 w-48" aria-hidden />
              <div className="h-10 w-64" aria-hidden />
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
