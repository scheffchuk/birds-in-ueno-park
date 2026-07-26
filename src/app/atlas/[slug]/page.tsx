import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { loadListedSpecies } from "@/lib/atlas/load-listed-species";
import { AtlasDetailView } from "@/components/atlas/AtlasDetailView";

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

function AtlasDetailFallback() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="mx-auto flex w-full max-w-2xl flex-1 items-center justify-center px-6 py-10">
        <p className="font-mono text-[10px] tracking-[0.18em] text-ink-soft uppercase">
          Loading species…
        </p>
      </div>
    </div>
  );
}

export default function AtlasSpeciesPage({ params }: PageProps) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Suspense fallback={<AtlasDetailFallback />}>
        <AtlasSpeciesBody params={params} />
      </Suspense>
    </main>
  );
}
