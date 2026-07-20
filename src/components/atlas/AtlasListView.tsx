"use client";

import Link from "next/link";
import { useState } from "react";
import { selectForAtlas } from "@/lib/atlas/select";
import { currentTokyoSeason } from "@/lib/collage/season";
import type { SeasonFilter, SpeciesRecord } from "@/lib/collage/types";
import { SeasonPicker } from "@/components/collage/SeasonPicker";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AtlasListViewProps = {
  species: SpeciesRecord[];
};

export function AtlasListView({ species }: AtlasListViewProps) {
  const [season, setSeason] = useState<SeasonFilter>(() =>
    currentTokyoSeason(),
  );
  const rows = selectForAtlas(species, season);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-4">
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "link", size: "sm" }),
            "self-start px-0",
          )}
        >
          ← Collage
        </Link>
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-3xl tracking-tight md:text-4xl">
            Atlas 図鑑
          </h1>
          <p className="text-sm text-muted-foreground">
            Guide species by Season Prevalence
          </p>
        </div>
        <SeasonPicker value={season} onChange={setSeason} />
      </header>

      {rows.length === 0 ? (
        <p className="text-muted-foreground">
          No Guide species for this Season.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {rows.map((row) => (
            <li key={row.slug}>
              <Link
                href={`/atlas/${row.slug}`}
                className="flex items-baseline justify-between gap-4 py-4 transition-opacity hover:opacity-70"
              >
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-heading text-lg leading-tight">
                    {row.comNameEn}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {row.comNameJa}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {row.comNameZhTw}
                  </span>
                  <span className="text-xs italic text-muted-foreground">
                    {row.sciName}
                  </span>
                </span>
                <span className="shrink-0 tabular-nums text-sm text-muted-foreground">
                  {row.prevalence}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
