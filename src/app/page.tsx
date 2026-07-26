import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { preloadQuery } from "convex/nextjs";
import { api } from "../../convex/_generated/api";
import { CollageClient } from "./CollageClient";
import { SiteFooter } from "@/components/site/SiteFooter";

async function CollagePreload() {
  // Live Convex preload — request-time only (not build/prerender).
  await connection();
  const preloaded = await preloadQuery(api.species.listForCollage);
  return <CollageClient preloaded={preloaded} />;
}

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <div className="flex min-h-0 flex-1 flex-col">
        <nav className="fixed top-4 right-4 z-30 flex items-center gap-2 md:top-5 md:right-7">
          <Link
            href="/atlas"
            className="rounded-full bg-background px-3.5 py-2 font-mono text-[10px] tracking-[0.18em] text-ink uppercase shadow-(--raised) transition-transform hover:-translate-y-px"
          >
            Atlas 図鑑
          </Link>
          <Link
            href="/about"
            className="rounded-full bg-background px-3.5 py-2 font-mono text-[10px] tracking-[0.18em] text-ink uppercase shadow-(--raised) transition-transform hover:-translate-y-px"
          >
            About
          </Link>
        </nav>

        <header className="flex flex-col items-center gap-1.5 px-4 pt-20 pb-3 text-center md:pt-24 md:pb-4">
          <p className="font-heading text-sm tracking-wide text-ink-2 italic md:text-base">
            Ueno Park · Shinobazu Pond
          </p>
          <h1 className="font-heading text-3xl tracking-tight text-ink md:text-5xl">
            Birds in Ueno
          </h1>
        </header>

        <div className="relative mx-auto min-h-[60vh] w-full max-w-325 flex-1 px-2 md:px-8">
          <Suspense fallback={null}>
            <CollagePreload />
          </Suspense>
        </div>

        <SiteFooter />
      </div>
    </main>
  );
}
