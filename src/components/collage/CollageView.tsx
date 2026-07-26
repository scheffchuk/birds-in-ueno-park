"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { packCollage } from "@/lib/collage/pack";
import { selectForCollage } from "@/lib/collage/select";
import { currentTokyoSeason } from "@/lib/collage/season";
import type { PackedBird, SeasonFilter, SpeciesRecord } from "@/lib/collage/types";
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

function poseUrl(tile: PackedBird): string | undefined {
  let h = 0;
  for (let i = 0; i < tile.slug.length; i += 1) {
    h = (h * 31 + tile.slug.charCodeAt(i)) | 0;
  }
  const preferFlight = (h & 1) === 1;
  if (preferFlight && tile.flightUrl) return tile.flightUrl;
  if (tile.perchUrl) return tile.perchUrl;
  return tile.flightUrl;
}

export function CollageView({ species }: CollageViewProps) {
  const [season, setSeason] = useState<SeasonFilter>(() =>
    currentTokyoSeason(),
  );
  const [placed, setPlaced] = useState<PackedBird[]>([]);
  const [layoutReady, setLayoutReady] = useState(false);
  const [hovered, setHovered] = useState<PackedBird | null>(null);
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
    <>
      <SeasonPicker
        value={season}
        onChange={setSeason}
        className="fixed top-4 left-4 z-30 md:top-5 md:left-7"
      />

      <div
        ref={stageRef}
        className="absolute inset-0 overflow-hidden"
        aria-label="Bird collage"
        onMouseLeave={() => setHovered(null)}
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
              <Link
                href="/atlas"
                className="rounded-full bg-background px-4 py-2 font-mono text-[10px] tracking-[0.18em] text-ink uppercase shadow-[var(--raised)]"
              >
                Browse the Atlas 図鑑を見る
              </Link>
            </EmptyContent>
          </Empty>
        ) : (
          placed.map((tile, index) => {
            const src = poseUrl(tile);
            const delay = Math.min(index * 28, 420);
            return (
              <Link
                key={tile.slug}
                href={`/atlas/${tile.slug}`}
                className="collage-tile-enter absolute transition-transform duration-200 ease-out hover:z-10 hover:scale-[1.04]"
                style={{
                  left: tile.x,
                  top: tile.y,
                  width: tile.width,
                  height: tile.height,
                  animation: `collage-tile-in 420ms cubic-bezier(.2,.7,.3,1) ${delay}ms backwards`,
                }}
                onMouseEnter={() => setHovered(tile)}
                onFocus={() => setHovered(tile)}
              >
                {src ? (
                  <Image
                    src={src}
                    alt={tile.comNameEn}
                    fill
                    sizes={`${Math.ceil(tile.width)}px`}
                    className="object-contain drop-shadow-[0_2px_8px_rgba(26,22,18,0.12)] transition-[filter] duration-200 hover:drop-shadow-[0_3px_10px_rgba(26,22,18,0.26)]"
                    unoptimized
                  />
                ) : (
                  <PlaceholderSilhouette
                    label={tile.comNameEn}
                    prevalence={tile.prevalence}
                  />
                )}
              </Link>
            );
          })
        )}

        <div
          className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full bg-background px-3.5 py-1.5 font-heading text-[13px] tracking-wide text-ink italic shadow-[0_2px_8px_rgba(26,22,18,0.06)] transition-opacity duration-150"
          style={{ opacity: hovered ? 1 : 0 }}
          aria-hidden={!hovered}
        >
          {hovered ? (
            <span>
              <span className="font-semibold not-italic">{hovered.comNameEn}</span>
              <span className="text-ink-soft"> · {hovered.comNameJa}</span>
            </span>
          ) : null}
        </div>
      </div>
    </>
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
