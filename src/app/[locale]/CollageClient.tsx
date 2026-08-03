"use client";

import { usePreloadedQuery, type Preloaded } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { CollageView } from "@/components/collage/CollageView";
import { ConvexClientProvider } from "@/components/Providers";

type CollageClientProps = {
  preloaded: Preloaded<typeof api.species.listForCollage>;
  lcpSlug?: string | null;
};

export function CollageClient({ preloaded, lcpSlug }: CollageClientProps) {
  return (
    <ConvexClientProvider>
      <CollageBody preloaded={preloaded} lcpSlug={lcpSlug} />
    </ConvexClientProvider>
  );
}

function CollageBody({ preloaded, lcpSlug }: CollageClientProps) {
  const species = usePreloadedQuery(preloaded);
  return <CollageView species={species} lcpSlug={lcpSlug} />;
}
