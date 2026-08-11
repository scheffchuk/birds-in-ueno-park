"use client";

import { useLayoutEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { isSeasonFilter, SEASON_FILTERS } from "@/lib/season/url";
import type { SeasonFilter } from "@/lib/season/types";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

type SeasonPickerProps = {
  value: SeasonFilter;
  onChange: (next: SeasonFilter) => void;
  className?: string;
};

/** Presentational Season filter toggle — private to the Season UI module. */
export function SeasonPicker({ value, onChange, className }: SeasonPickerProps) {
  const t = useTranslations("Season");
  const trackRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const track = trackRef.current;
    const pill = pillRef.current;
    if (!track || !pill) return;

    const sync = () => {
      const active = track.querySelector<HTMLElement>("[data-pressed]");
      if (!active) return;
      pill.style.width = `${active.offsetWidth}px`;
      pill.style.transform = `translateX(${active.offsetLeft}px)`;
    };

    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(track);
    for (const btn of track.querySelectorAll("button")) {
      ro.observe(btn);
    }
    return () => ro.disconnect();
  }, [value]);

  return (
    <div
      ref={trackRef}
      className={cn(
        "relative inline-flex h-8 items-center rounded-full bg-paper-2 p-1 shadow-(--recess)",
        className,
      )}
    >
      <span
        ref={pillRef}
        aria-hidden
        className="pointer-events-none absolute inset-y-1 left-0 z-0 rounded-full bg-background shadow-(--raised) transition-[transform,width] duration-[320ms] ease-[cubic-bezier(0.7,0.05,0.2,1)] will-change-[transform,width]"
      />
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
        className="z-10 h-full items-stretch gap-0 rounded-full bg-transparent p-0 shadow-none"
      >
        {SEASON_FILTERS.map((id) => (
          <ToggleGroupItem
            key={id}
            value={id}
            aria-label={t(id)}
            className={cn(
              "relative z-10 h-full min-h-0 min-w-0 rounded-full border-0 bg-transparent py-0 font-mono text-[10px] leading-none text-ink-soft uppercase shadow-none",
              "inline-flex items-center justify-center",
              "px-3 group-data-[spacing=0]/toggle-group:rounded-full group-data-[spacing=0]/toggle-group:px-3",
              "group-data-horizontal/toggle-group:data-[spacing=0]:first:rounded-full group-data-horizontal/toggle-group:data-[spacing=0]:last:rounded-full",
              "hover:bg-transparent hover:text-ink",
              "aria-pressed:bg-transparent aria-pressed:text-ink data-pressed:bg-transparent data-pressed:text-ink data-pressed:shadow-none",
            )}
          >
            <span className="hidden tracking-[0.14em] pl-[0.14em] sm:inline">
              {t(id)}
            </span>
            <span className="tracking-[0.14em] pl-[0.14em] sm:hidden">
              {t(`short.${id}`)}
            </span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
