"use client";

import { usePreloadedQuery, type Preloaded } from "convex/react";
import { api } from "../../convex/_generated/api";
import { CollageView } from "@/components/collage/CollageView";
import { ConvexClientProvider } from "@/components/Providers";

type CollageClientProps = {
  preloaded: Preloaded<typeof api.species.listForCollage>;
};

export function CollageClient({ preloaded }: CollageClientProps) {
  return (
    <ConvexClientProvider>
      <CollageBody preloaded={preloaded} />
    </ConvexClientProvider>
  );
}

function CollageBody({ preloaded }: CollageClientProps) {
  const species = usePreloadedQuery(preloaded);
  return <CollageView species={species} />;
}
