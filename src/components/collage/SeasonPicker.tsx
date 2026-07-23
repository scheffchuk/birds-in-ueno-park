"use client";

import type { SeasonFilter } from "@/lib/collage/types";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

const SEASON_OPTIONS: { id: SeasonFilter; label: string; short: string }[] = [
  { id: "winter", label: "Winter 冬", short: "冬" },
  { id: "spring", label: "Spring 春", short: "春" },
  { id: "summer", label: "Summer 夏", short: "夏" },
  { id: "autumn", label: "Autumn 秋", short: "秋" },
  { id: "all", label: "All year 通年", short: "通年" },
];

function isSeasonFilter(value: string): value is SeasonFilter {
  return SEASON_OPTIONS.some((option) => option.id === value);
}

type SeasonPickerProps = {
  value: SeasonFilter;
  onChange: (next: SeasonFilter) => void;
  className?: string;
};

export function SeasonPicker({ value, onChange, className }: SeasonPickerProps) {
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
      aria-label="Season"
      className={cn(
        "rounded-full bg-paper-2 p-1 shadow-[var(--recess)]",
        className,
      )}
    >
      {SEASON_OPTIONS.map((option) => (
        <ToggleGroupItem
          key={option.id}
          value={option.id}
          aria-label={option.label}
          className={cn(
            "h-auto min-h-0 rounded-full border-0 px-3 py-1.5 font-mono text-[10px] leading-none tracking-[0.14em] text-ink-soft uppercase shadow-none",
            "inline-flex items-center justify-center hover:bg-transparent hover:text-ink",
            "data-[state=on]:bg-background data-[state=on]:text-ink data-[state=on]:shadow-[var(--raised)]",
          )}
        >
          <span className="hidden sm:inline">{option.label}</span>
          <span className="sm:hidden">{option.short}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
