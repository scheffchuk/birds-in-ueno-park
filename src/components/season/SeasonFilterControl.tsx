"use client";

import { SeasonPicker } from "@/components/season/SeasonPicker";
import { useSeasonFilter } from "@/lib/season/use-season-filter";

/** Season filter UI bound to shareable `?season=` URL state. */
export function SeasonFilterControl({
  className,
}: {
  className?: string;
}) {
  const { season, setSeason } = useSeasonFilter();
  return (
    <SeasonPicker value={season} onChange={setSeason} className={className} />
  );
}
