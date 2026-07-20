"use client";

import type { SeasonFilter } from "@/lib/collage/types";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const SEASON_OPTIONS: { id: SeasonFilter; label: string }[] = [
  { id: "winter", label: "Winter 冬" },
  { id: "spring", label: "Spring 春" },
  { id: "summer", label: "Summer 夏" },
  { id: "autumn", label: "Autumn 秋" },
  { id: "all", label: "All year 通年" },
];

function isSeasonFilter(value: string): value is SeasonFilter {
  return SEASON_OPTIONS.some((option) => option.id === value);
}

type SeasonPickerProps = {
  value: SeasonFilter;
  onChange: (next: SeasonFilter) => void;
};

export function SeasonPicker({ value, onChange }: SeasonPickerProps) {
  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(next) => {
        const selected = next[0];
        if (selected && isSeasonFilter(selected)) {
          onChange(selected);
        }
      }}
      variant="outline"
      size="sm"
      spacing={0}
      aria-label="Season"
    >
      {SEASON_OPTIONS.map((option) => (
        <ToggleGroupItem
          key={option.id}
          value={option.id}
          aria-label={option.label}
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
