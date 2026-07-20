"use client";

import { useQuery } from "convex/react";
import { notFound } from "next/navigation";
import { use } from "react";
import { api } from "../../../../convex/_generated/api";
import { findListedBySlug } from "@/lib/atlas/find";
import { AtlasDetailView } from "@/components/atlas/AtlasDetailView";
import { FIXTURE_SPECIES } from "@/lib/fixtures/guide-species";

const hasConvex = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

type PageProps = {
  params: Promise<{ slug: string }>;
};

function DetailFromFixtures({ slug }: { slug: string }) {
  const species = findListedBySlug(FIXTURE_SPECIES, slug);
  if (!species) notFound();
  return <AtlasDetailView species={species} />;
}

function DetailFromConvex({ slug }: { slug: string }) {
  const species = useQuery(api.species.getSpecies, { slug });
  if (species === undefined) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10 text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (species === null) notFound();
  return <AtlasDetailView species={species} />;
}

export default function AtlasSpeciesPage({ params }: PageProps) {
  const { slug } = use(params);
  return (
    <main className="min-h-screen bg-background text-foreground">
      {hasConvex ? (
        <DetailFromConvex slug={slug} />
      ) : (
        <DetailFromFixtures slug={slug} />
      )}
    </main>
  );
}
