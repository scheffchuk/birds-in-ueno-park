"use client";

import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { SeasonPicker } from "@/components/collage/SeasonPicker";
import { parseSeasonSearchParam } from "@/lib/collage/season";
import type { SeasonFilter } from "@/lib/collage/types";

export function AtlasSeasonPicker() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const value = parseSeasonSearchParam(searchParams.get("season") ?? undefined);

  return (
    <SeasonPicker
      value={value}
      onChange={(next: SeasonFilter) => {
        router.replace({ pathname, query: { season: next } });
      }}
    />
  );
}
