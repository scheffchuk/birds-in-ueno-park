"use client";

import { SeasonPicker } from "@/components/season/SeasonPicker";
import { useSeasonFilter } from "@/lib/season/use-season-filter";

type SeasonFilterControlProps = {
  className?: string;
};

/** Season filter UI bound to shareable `?season=` URL state. */
export function SeasonFilterControl({ className }: SeasonFilterControlProps) {
  const { season, setSeason } = useSeasonFilter();
  return (
    <SeasonPicker value={season} onChange={setSeason} className={className} />
  );
}
