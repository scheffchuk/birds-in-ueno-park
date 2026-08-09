"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { startTransition, useEffect, useRef, useState } from "react";
import { COLLAGE_IMAGE_SIZES, largestTileSlug } from "@/lib/collage/image";
import { packCollage } from "@/lib/collage/pack";
import { prevalenceForFilter } from "@/lib/collage/prevalence";
import { selectForCollage } from "@/lib/collage/select";
import type { CollageSpecies, PackedBird } from "@/lib/collage/types";
import { useSeasonFilter } from "@/lib/collage/use-season-filter";
import { commonNameForLocale } from "@/lib/locale/species";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { SeasonLink } from "@/components/site/SeasonLink";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { SeasonFilterPicker } from "./SeasonFilterPicker";

type CollageViewProps = {
  species: CollageSpecies[];
};

export function CollageView({ species }: CollageViewProps) {
  const t = useTranslations("Collage");
  const locale = useLocale() as AppLocale;
  const { season } = useSeasonFilter();
  const [placed, setPlaced] = useState<PackedBird[]>([]);
  const [layoutReady, setLayoutReady] = useState(false);
  // First paint only — season switches should not replay staggered enter motion.
  const [enterMotion, setEnterMotion] = useState(true);
  const [hovered, setHovered] = useState<PackedBird | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    const layout = () => {
      const selected = selectForCollage(species, season);
      const { width, height } = el.getBoundingClientRect();
      const next = packCollage(selected, width, height);
      // Keep prior tiles visible while packing; don't blank the stage.
      startTransition(() => {
        setPlaced(next);
        setLayoutReady(true);
      });
    };

    layout();
    const observer = new ResizeObserver(layout);
    observer.observe(el);
    return () => observer.disconnect();
  }, [species, season]);

  useEffect(() => {
    if (!enterMotion || !layoutReady || placed.length === 0) return;
    // Clear after the staggered enter finishes so later Season switches stay snappy.
    const id = window.setTimeout(() => setEnterMotion(false), 900);
    return () => window.clearTimeout(id);
  }, [enterMotion, layoutReady, placed.length]);

  const hasBirds = species.some((s) => prevalenceForFilter(s, season) > 0);
  const showEmpty = !hasBirds || (layoutReady && placed.length === 0);
  const prioritySlug = largestTileSlug(placed);
  const hoverName = hovered ? commonNameForLocale(hovered, locale) : null;

  return (
    <>
      <SeasonFilterPicker className="fixed top-4 left-4 z-30 md:top-5 md:left-7" />

      <div
        ref={stageRef}
        className="absolute inset-0 overflow-hidden"
        aria-label={t("ariaLabel")}
        onMouseLeave={() => setHovered(null)}
      >
        {showEmpty ? (
          <Empty className="absolute inset-0 border-0">
            <EmptyHeader>
              <EmptyTitle className="font-heading text-xl">
                {t("emptyTitle")}
              </EmptyTitle>
              <EmptyDescription>{t("emptyDescription")}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <SeasonLink
                pathname="/atlas"
                className="rounded-full bg-background px-4 py-2 font-mono text-[10px] tracking-[0.18em] text-ink uppercase shadow-[var(--raised)]"
              >
                {t("browseAtlas")}
              </SeasonLink>
            </EmptyContent>
          </Empty>
        ) : (
          placed.map((tile, index) => {
            const isPriority = tile.slug === prioritySlug;
            const delay = isPriority ? 0 : Math.min(index * 28, 420);
            const name = commonNameForLocale(tile, locale);
            const animate = enterMotion && !isPriority;
            return (
              <Link
                key={tile.slug}
                href={`/atlas/${tile.slug}`}
                className={cn(
                  "absolute transition-transform duration-200 ease-out hover:z-10 hover:scale-[1.04]",
                  animate && "collage-tile-enter",
                )}
                style={{
                  left: tile.x,
                  top: tile.y,
                  width: tile.width,
                  height: tile.height,
                  ...(animate
                    ? {
                        animation: `collage-tile-in 420ms cubic-bezier(.2,.7,.3,1) ${delay}ms backwards`,
                      }
                    : {}),
                }}
                onMouseEnter={() => setHovered(tile)}
                onFocus={() => setHovered(tile)}
              >
                <Image
                  src={tile.url}
                  alt={name}
                  fill
                  sizes={COLLAGE_IMAGE_SIZES}
                  className="object-contain drop-shadow-[0_2px_8px_rgba(26,22,18,0.12)] transition-[filter] duration-200 hover:drop-shadow-[0_3px_10px_rgba(26,22,18,0.26)]"
                  loading="eager"
                  priority={isPriority}
                />
              </Link>
            );
          })
        )}

        <div
          className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full bg-background px-3.5 py-1.5 font-heading text-[13px] tracking-wide text-ink-2 italic shadow-[0_2px_8px_rgba(26,22,18,0.06)] transition-opacity duration-150"
          style={{ opacity: hovered ? 1 : 0 }}
          aria-hidden={!hovered}
        >
          {hoverName ? (
            <span className="font-semibold not-italic">{hoverName}</span>
          ) : null}
        </div>
      </div>
    </>
  );
}
