import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";
import { selectForAtlas } from "@/lib/atlas/select";
import { parseSeasonSearchParam } from "@/lib/collage/season";
import { AtlasSpeciesCard } from "@/components/atlas/AtlasSpeciesCard";
import { SiteFooter } from "@/components/site/SiteFooter";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { AtlasSeasonPicker } from "./AtlasSeasonPicker";

type PageProps = {
  searchParams: Promise<{ season?: string | string[] }>;
};

async function AtlasSeasonBody({ searchParams }: PageProps) {
  await connection();
  const { season: seasonParam } = await searchParams;
  const season = parseSeasonSearchParam(seasonParam);
  const species = await fetchQuery(api.species.listAtlas);
  const rows = selectForAtlas(species, season);

  return (
    <>
      <div className="flex justify-center">
        <AtlasSeasonPicker value={season} />
      </div>

      {rows.length === 0 ? (
        <Empty className="border-0 py-16">
          <EmptyHeader>
            <EmptyTitle className="font-heading text-xl">
              No Guide species for this Season
            </EmptyTitle>
            <EmptyDescription>
              Try another season, or browse All.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {rows.map((row, index) => (
            <li key={row.slug}>
              <AtlasSpeciesCard
                slug={row.slug}
                comNameEn={row.comNameEn}
                sciName={row.sciName}
                imageUrl={row.imageUrl}
                index={index}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function AtlasListFallback() {
  return (
    <>
      <div className="h-10" aria-hidden />
      <div className="min-h-[50vh]" aria-hidden />
    </>
  );
}

export default function AtlasPage({ searchParams }: PageProps) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen flex-col bg-background">
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10 md:px-8">
          <header className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link
                href="/"
                className="font-mono text-[10px] tracking-[0.18em] text-ink-soft uppercase transition-colors hover:text-ink"
              >
                ← Collage コラージュ
              </Link>
              <Link
                href="/about"
                className="font-mono text-[10px] tracking-[0.18em] text-ink-soft uppercase transition-colors hover:text-ink"
              >
                About について
              </Link>
            </div>
            <div className="flex flex-col gap-1 text-center">
              <h1 className="font-heading text-3xl tracking-tight text-ink md:text-5xl">
                Atlas 図鑑
              </h1>
              <p className="text-sm text-ink-soft">
                Guide species for the selected season
              </p>
            </div>
          </header>

          <Suspense fallback={<AtlasListFallback />}>
            <AtlasSeasonBody searchParams={searchParams} />
          </Suspense>
        </div>
        <SiteFooter />
      </div>
    </main>
  );
}
