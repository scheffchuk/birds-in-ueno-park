"use client";

import { useTranslations } from "next-intl";
import type { SeasonalPrevalence } from "@/lib/guide/types";
import type { Season } from "@/lib/season/types";

const SEASONS: Season[] = ["winter", "spring", "summer", "autumn"];

type PrevalenceChartProps = {
  prevalence: SeasonalPrevalence;
};

/** Four-bar Season Prevalence chart (0–100). */
export function PrevalenceChart({ prevalence }: PrevalenceChartProps) {
  const t = useTranslations("Season");
  const tDetail = useTranslations("AtlasDetail");

  return (
    <div
      className="grid grid-cols-4 items-end gap-3 border-t border-hairline pt-4"
      role="img"
      aria-label={tDetail("prevalence")}
    >
      {SEASONS.map((season) => {
        const value = prevalence[season];
        const label = t(season);
        const heightPct = Math.max(value, value > 0 ? 4 : 0);
        return (
          <div key={season} className="flex flex-col items-center gap-2">
            <span className="font-mono text-xs tabular-nums text-ink-soft">
              {value}
            </span>
            <div className="flex h-36 w-full items-end justify-center">
              <div
                className="w-full max-w-12 bg-ink-2/85"
                style={{ height: `${heightPct}%` }}
                title={`${label}: ${value}`}
              />
            </div>
            <span className="text-center text-xs text-ink-soft">{label}</span>
          </div>
        );
      })}
    </div>
  );
}
