import Link from "next/link";
import { ebirdSpeciesUrl } from "@/lib/atlas/ebird";
import type { SpeciesRecord } from "@/lib/collage/types";
import { PrevalenceChart } from "@/components/atlas/PrevalenceChart";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AtlasDetailViewProps = {
  species: SpeciesRecord;
};

export function AtlasDetailView({ species }: AtlasDetailViewProps) {
  return (
    <article className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-10 px-6 py-10">
      <header className="flex flex-col gap-4">
        <Link
          href="/atlas"
          className={cn(
            buttonVariants({ variant: "link", size: "sm" }),
            "self-start px-0",
          )}
        >
          ← Atlas 図鑑
        </Link>
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-3xl tracking-tight md:text-4xl">
            {species.comNameEn}
          </h1>
          <p className="text-lg text-muted-foreground">{species.comNameJa}</p>
          <p className="text-lg text-muted-foreground">{species.comNameZhTw}</p>
          <p className="text-sm italic text-muted-foreground">{species.sciName}</p>
        </div>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-xl">Prevalence by Season</h2>
        <PrevalenceChart prevalence={species.prevalence} />
      </section>

      <p>
        <a
          href={ebirdSpeciesUrl(species.sciName)}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "outline" })}
        >
          View on eBird
        </a>
      </p>

      <Link
        href="/"
        className={cn(buttonVariants({ variant: "link", size: "sm" }), "px-0")}
      >
        ← Collage
      </Link>
    </article>
  );
}
