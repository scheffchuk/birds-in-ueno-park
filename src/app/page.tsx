import { Suspense } from "react";
import { connection } from "next/server";
import { preloadQuery } from "convex/nextjs";
import { api } from "../../convex/_generated/api";
import { CollageClient } from "./CollageClient";

async function CollagePreload() {
  // Live Convex preload — request-time only (not build/prerender).
  await connection();
  const preloaded = await preloadQuery(api.species.listForCollage);
  return <CollageClient preloaded={preloaded} />;
}

function CollageShellFallback() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1 items-center justify-center px-6">
        <p className="font-mono text-[10px] tracking-[0.18em] text-ink-soft uppercase">
          Loading collage…
        </p>
      </div>
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<CollageShellFallback />}>
      <CollagePreload />
    </Suspense>
  );
}
