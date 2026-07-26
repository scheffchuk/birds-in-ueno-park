import type { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { notFound } from "next/navigation";
import { cache } from "react";
import { api } from "../../../../convex/_generated/api";
import { AtlasDetailView } from "@/components/atlas/AtlasDetailView";

type PageProps = {
  params: Promise<{ slug: string }>;
};

const loadListedSpecies = cache(async (slug: string) => {
  return await fetchQuery(api.species.getSpecies, { slug });
});

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

export default async function AtlasSpeciesPage({ params }: PageProps) {
  const { slug } = await params;
  const species = await loadListedSpecies(slug);
  if (!species) notFound();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <AtlasDetailView species={species} />
    </main>
  );
}
