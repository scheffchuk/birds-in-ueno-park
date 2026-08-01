"use client";

import { useTranslations } from "next-intl";
import type { SeasonFilter } from "@/lib/collage/types";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

const SEASON_IDS: SeasonFilter[] = [
  "winter",
  "spring",
  "summer",
  "autumn",
  "all",
];

function isSeasonFilter(value: string): value is SeasonFilter {
  return SEASON_IDS.includes(value as SeasonFilter);
}

type SeasonPickerProps = {
  value: SeasonFilter;
  onChange: (next: SeasonFilter) => void;
  className?: string;
};

export function SeasonPicker({ value, onChange, className }: SeasonPickerProps) {
  const t = useTranslations("Season");

  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(next) => {
        const selected = next[0];
        if (selected && isSeasonFilter(selected)) {
          onChange(selected);
        }
      }}
      variant="default"
      size="sm"
      spacing={0}
      aria-label={t("ariaLabel")}
      className={cn(
        "rounded-full bg-paper-2 p-1 shadow-[var(--recess)]",
        className,
      )}
    >
      {SEASON_IDS.map((id) => (
        <ToggleGroupItem
          key={id}
          value={id}
          aria-label={t(id)}
          className={cn(
            "h-auto min-h-0 rounded-full border-0 px-3 py-1.5 font-mono text-[10px] leading-none tracking-[0.14em] text-ink-soft uppercase shadow-none",
            "inline-flex items-center justify-center hover:bg-transparent hover:text-ink",
            "data-[state=on]:bg-background data-[state=on]:text-ink data-[state=on]:shadow-[var(--raised)]",
          )}
        >
          <span className="hidden sm:inline">{t(id)}</span>
          <span className="sm:hidden">{t(`short.${id}`)}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
