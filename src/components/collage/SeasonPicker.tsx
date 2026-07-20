"use client";

import type { SeasonFilter } from "@/lib/collage/types";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const TABS: { id: SeasonFilter; label: string }[] = [
  { id: "winter", label: "Winter 冬" },
  { id: "spring", label: "Spring 春" },
  { id: "summer", label: "Summer 夏" },
  { id: "autumn", label: "Autumn 秋" },
  { id: "all", label: "All year 通年" },
];

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
        if (
          selected === "winter" ||
          selected === "spring" ||
          selected === "summer" ||
          selected === "autumn" ||
          selected === "all"
        ) {
          onChange(selected);
        }
      }}
      variant="outline"
      size="sm"
      spacing={0}
      aria-label="Season"
    >
      {TABS.map((tab) => (
        <ToggleGroupItem key={tab.id} value={tab.id} aria-label={tab.label}>
          {tab.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
