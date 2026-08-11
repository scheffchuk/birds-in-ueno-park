"use client";

import { useLocale, useTranslations } from "next-intl";
import { SeasonFilterControl } from "@/components/season/SeasonFilterControl";
import { AtlasSpeciesCard } from "./AtlasSpeciesCard";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { selectForAtlas, type AtlasListSource } from "@/lib/atlas/select";
import {
  useSeasonFilter,
  useSeasonQuery,
} from "@/lib/season/use-season-filter";
import { commonNameForLocale } from "@/lib/locale/species";
import type { AppLocale } from "@/i18n/routing";

type AtlasListViewProps = {
  species: AtlasListSource[];
};

/** Client Season filter + list — same `?season=` model as the collage. */
export function AtlasListView({ species }: AtlasListViewProps) {
  const t = useTranslations("Atlas");
  const tSeason = useTranslations("Season");
  const locale = useLocale() as AppLocale;
  const { season } = useSeasonFilter();
  const seasonQuery = useSeasonQuery();
  const rows = selectForAtlas(species, season);

  return (
    <div className="flex flex-col gap-8">
      <p className="text-center text-sm text-ink-soft">
        {t("subtitle", { season: tSeason(season) })}
      </p>

      <div className="flex justify-center">
        <SeasonFilterControl />
      </div>

      {rows.length === 0 ? (
        <Empty className="border-0 py-16">
          <EmptyHeader>
            <EmptyTitle className="font-heading text-xl">
              {t("emptyTitle")}
            </EmptyTitle>
            <EmptyDescription>{t("emptyDescription")}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {rows.map((row, index) => (
            <li key={row.slug}>
              <AtlasSpeciesCard
                slug={row.slug}
                comName={commonNameForLocale(row, locale)}
                sciName={row.sciName}
                imageUrl={row.imageUrl}
                index={index}
                season={seasonQuery}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
