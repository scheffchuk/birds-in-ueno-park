"use client";

import Link from "next/link";
import { useState } from "react";
import { selectForAtlas } from "@/lib/atlas/select";
import { currentTokyoSeason } from "@/lib/collage/season";
import type { SeasonFilter, SpeciesRecord } from "@/lib/collage/types";
import { SeasonPicker } from "@/components/collage/SeasonPicker";
import { SiteFooter } from "@/components/site/SiteFooter";

type AtlasListViewProps = {
  species: SpeciesRecord[];
};

export function AtlasListView({ species }: AtlasListViewProps) {
  const [season, setSeason] = useState<SeasonFilter>(() =>
    currentTokyoSeason(),
  );
  const rows = selectForAtlas(species, season);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-10 md:px-8">
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
            <h1 className="font-heading text-3xl font-bold tracking-[0.06em] text-ink uppercase md:text-4xl">
              Atlas 図鑑
            </h1>
            <p className="text-sm text-ink-soft">
              Guide species by Season Prevalence
            </p>
          </div>
          <div className="flex justify-center">
            <SeasonPicker value={season} onChange={setSeason} />
          </div>
        </header>

        {rows.length === 0 ? (
          <p className="text-center text-ink-soft">
            No Guide species for this Season.
          </p>
        ) : (
          <ul className="flex flex-col">
            {rows.map((row) => (
              <li key={row.slug} className="border-t border-hairline">
                <Link
                  href={`/atlas/${row.slug}`}
                  className="flex items-baseline justify-between gap-4 py-4 transition-opacity hover:opacity-70"
                >
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="font-heading text-lg leading-tight text-ink">
                      {row.comNameEn}
                    </span>
                    <span className="text-sm text-ink-2">{row.comNameJa}</span>
                    <span className="text-sm text-ink-2">{row.comNameZhTw}</span>
                    <span className="text-xs text-ink-soft italic">
                      {row.sciName}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-sm tabular-nums text-ink-soft">
                    {row.prevalence}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
