"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { packCollage } from "@/lib/collage/pack";
import { selectForCollage } from "@/lib/collage/select";
import { currentTokyoSeason } from "@/lib/collage/season";
import type { PackedBird, SeasonFilter, SpeciesRecord } from "@/lib/collage/types";
import { buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { SeasonPicker } from "./SeasonPicker";

type CollageViewProps = {
  species: SpeciesRecord[];
};

export function CollageView({ species }: CollageViewProps) {
  const [season, setSeason] = useState<SeasonFilter>(() =>
    currentTokyoSeason(),
  );
  const [placed, setPlaced] = useState<PackedBird[]>([]);
  const [layoutReady, setLayoutReady] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    const layout = () => {
      const selected = selectForCollage(species, season);
      const { width, height } = el.getBoundingClientRect();
      setPlaced(packCollage(selected, width, height));
      setLayoutReady(true);
    };

    setLayoutReady(false);
    layout();
    const observer = new ResizeObserver(layout);
    observer.observe(el);
    return () => observer.disconnect();
  }, [species, season]);

  const birds = selectForCollage(species, season);
  const showEmpty = birds.length === 0 || (layoutReady && placed.length === 0);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-8">
        <div className="flex flex-col gap-1">
          <p className="font-heading text-2xl tracking-tight md:text-3xl">
            Birds in Ueno
          </p>
          <p className="text-sm text-muted-foreground">
            Ueno Park · Shinobazu Pond
          </p>
        </div>
        <nav className="flex flex-wrap items-center gap-3">
          <SeasonPicker value={season} onChange={setSeason} />
          <Link
            href="/atlas"
            className={buttonVariants({ variant: "link", size: "sm" })}
          >
            Atlas 図鑑
          </Link>
        </nav>
      </header>

      <div
        ref={stageRef}
        className="relative min-h-[70vh] flex-1 overflow-hidden"
        aria-label="Bird collage"
      >
        {showEmpty ? (
          <Empty className="absolute inset-0 border-0">
            <EmptyHeader>
              <EmptyTitle className="font-heading text-xl">
                Illustrations for this season are still being prepared
              </EmptyTitle>
              <EmptyDescription>
                この季節のイラストは準備中です
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Link href="/atlas" className={buttonVariants()}>
                Browse the Atlas 図鑑を見る
              </Link>
            </EmptyContent>
          </Empty>
        ) : (
          placed.map((tile) => (
            <Link
              key={tile.slug}
              href={`/atlas/${tile.slug}`}
              className="absolute"
              style={{
                left: tile.x,
                top: tile.y,
                width: tile.width,
                height: tile.height,
              }}
              title={`${tile.comNameEn}\n${tile.comNameJa}\n${tile.comNameZhTw}\n${tile.sciName}`}
            >
              <PlaceholderSilhouette
                label={tile.comNameEn}
                prevalence={tile.prevalence}
              />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

function PlaceholderSilhouette({
  label,
  prevalence,
}: {
  label: string;
  prevalence: number;
}) {
  const opacity = 0.35 + (prevalence / 100) * 0.45;
  return (
    <div
      className="flex h-full w-full items-end justify-center rounded-[40%_40%_35%_35%] bg-silhouette"
      style={{ opacity }}
      role="img"
      aria-label={label}
    >
      <span className="mb-2 max-w-[90%] truncate px-1 text-center text-[10px] text-primary-foreground md:text-xs">
        {label}
      </span>
    </div>
  );
}
