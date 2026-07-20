"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { AtlasListView } from "@/components/atlas/AtlasListView";
import { FIXTURE_SPECIES } from "@/lib/fixtures/guide-species";

const hasConvex = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

function AtlasFromConvex() {
  const fromConvex = useQuery(api.species.listAtlas);
  if (fromConvex === undefined) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10 text-muted-foreground">
        Loading…
      </div>
    );
  }
  return <AtlasListView species={fromConvex} />;
}

export function AtlasPageClient() {
  if (!hasConvex) {
    return <AtlasListView species={FIXTURE_SPECIES} />;
  }
  return <AtlasFromConvex />;
}
