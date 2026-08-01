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
      <nav className="fixed top-4 right-4 z-30 flex flex-col items-end gap-2 md:top-5 md:right-7">
        <div className="flex items-center gap-2">
          <Link
            href="/atlas"
            className="rounded-full bg-background px-3.5 py-2 font-mono text-[10px] tracking-[0.18em] text-ink uppercase shadow-(--raised) transition-transform hover:-translate-y-px"
          >
            {tNav("atlas")}
          </Link>
          <Link
            href="/about"
            className="rounded-full bg-background px-3.5 py-2 font-mono text-[10px] tracking-[0.18em] text-ink uppercase shadow-(--raised) transition-transform hover:-translate-y-px"
          >
            {tNav("about")}
          </Link>
        </div>
        <LocaleSwitcher />
      </nav>

      <header className="flex flex-col items-center gap-1.5 px-4 pt-20 pb-3 text-center md:pt-24 md:pb-4">
        <p className="font-heading text-sm tracking-wide text-ink-2 italic md:text-base">
          {t("place")}
        </p>
        <h1 className="font-heading text-3xl tracking-tight text-ink md:text-5xl">
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
            <header className="flex flex-col items-center gap-1.5 px-4 pt-20 pb-3 text-center md:pt-24 md:pb-4">
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
