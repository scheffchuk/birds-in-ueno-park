"use client";

import { SeasonPicker } from "@/components/collage/SeasonPicker";
import { useSeasonFilter } from "@/lib/collage/use-season-filter";

type SeasonFilterPickerProps = {
  className?: string;
};

/** SeasonPicker wired to shared `?season=` URL state. */
export function SeasonFilterPicker({ className }: SeasonFilterPickerProps) {
  const { season, setSeason } = useSeasonFilter();
  return (
    <SeasonPicker value={season} onChange={setSeason} className={className} />
  );
}
