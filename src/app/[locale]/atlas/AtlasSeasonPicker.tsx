"use client";

import { SeasonPicker } from "@/components/collage/SeasonPicker";
import { useSeasonFilter } from "@/lib/collage/use-season-filter";

export function AtlasSeasonPicker() {
  const [season, setSeason] = useSeasonFilter();

  return <SeasonPicker value={season} onChange={setSeason} />;
}
