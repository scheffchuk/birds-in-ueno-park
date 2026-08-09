"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useSeasonFilter } from "@/lib/collage/season-context";
import type { CollageArt, CollageLayouts } from "@/lib/collage/types";
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
import { SeasonFilterPicker } from "./SeasonFilterPicker";

/** One sizes hint for every tile — good enough; avoids per-tile packing math. */
const COLLAGE_IMAGE_SIZES = "(max-width: 767px) 30vw, 12vw";

type CollageViewProps = {
  layouts: CollageLayouts;
};

export function CollageView({ layouts }: CollageViewProps) {
  const t = useTranslations("Collage");
  const locale = useLocale() as AppLocale;
  const { season } = useSeasonFilter();
  const [hovered, setHovered] = useState<CollageArt | null>(null);

  const artBySlug = new Map(layouts.art.map((art) => [art.slug, art]));
  const { tiles } = layouts.seasons[season];
  const hoverName = hovered ? commonNameForLocale(hovered, locale) : null;

  return (
    <>
      <SeasonFilterPicker className="fixed top-4 left-4 z-30 md:top-5 md:left-7" />

      <div
        className="collage-frame"
        onMouseLeave={() => setHovered(null)}
      >
        {tiles.length === 0 ? (
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
          <div className="collage-stage" aria-label={t("ariaLabel")}>
            {tiles.map((tile) => {
              const art = artBySlug.get(tile.slug);
              if (!art) return null;
              const name = commonNameForLocale(art, locale);
              return (
                <Link
                  key={tile.slug}
                  href={`/atlas/${tile.slug}`}
                  className="absolute hover:z-10"
                  style={{
                    left: `${tile.x}%`,
                    top: `${tile.y}%`,
                    width: `${tile.width}%`,
                    height: `${tile.height}%`,
                  }}
                  onMouseEnter={() => setHovered(art)}
                  onFocus={() => setHovered(art)}
                >
                  <Image
                    src={art.url}
                    alt={name}
                    fill
                    sizes={COLLAGE_IMAGE_SIZES}
                    className="object-contain"
                    loading="lazy"
                  />
                </Link>
              );
            })}
          </div>
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
