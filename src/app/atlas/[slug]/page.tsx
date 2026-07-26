import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadListedSpecies } from "@/lib/atlas/load-listed-species";
import { AtlasDetailView } from "@/components/atlas/AtlasDetailView";
import { SiteFooter } from "@/components/site/SiteFooter";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const species = await loadListedSpecies(slug);
  if (!species) {
    return { title: "Not found" };
  }
  const description = species.descriptionEn?.trim();
  return {
    title: `${species.comNameEn} · ${species.comNameJa}`,
    ...(description ? { description } : {}),
  };
}

async function AtlasSpeciesBody({ params }: PageProps) {
  const { slug } = await params;
  const species = await loadListedSpecies(slug);
  if (!species) notFound();

  return <AtlasDetailView species={species} />;
}

export default function AtlasSpeciesPage({ params }: PageProps) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen flex-col bg-background">
        <article className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-6 py-10 md:px-8">
          <Link
            href="/atlas"
            className="self-start font-mono text-[10px] tracking-[0.18em] text-ink-soft uppercase transition-colors hover:text-ink"
          >
            ← Atlas 図鑑
          </Link>
          <Suspense fallback={<div className="min-h-[60vh]" aria-hidden />}>
            <AtlasSpeciesBody params={params} />
          </Suspense>
        </article>
        <SiteFooter />
      </div>
    </main>
  );
}
