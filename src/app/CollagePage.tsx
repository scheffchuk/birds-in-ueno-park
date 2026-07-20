"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { CollageView } from "@/components/collage/CollageView";
import { FIXTURE_SPECIES } from "@/lib/fixtures/guide-species";
import type { SpeciesRecord } from "@/lib/collage/types";

const hasConvex = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

function CollageFromConvex() {
  const fromConvex = useQuery(api.species.listForCollage);
  if (fromConvex === undefined) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background text-muted-foreground">
        Loading collage…
      </main>
    );
  }

  const species: SpeciesRecord[] = fromConvex;
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <CollageView species={species} />
    </main>
  );
}

export function CollagePage() {
  if (!hasConvex) {
    return (
      <main className="flex min-h-screen flex-col bg-background">
        <CollageView species={FIXTURE_SPECIES} />
      </main>
    );
  }
  return <CollageFromConvex />;
}
