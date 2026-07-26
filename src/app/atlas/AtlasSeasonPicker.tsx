"use client";

import { usePathname, useRouter } from "next/navigation";
import { SeasonPicker } from "@/components/collage/SeasonPicker";
import type { SeasonFilter } from "@/lib/collage/types";

type AtlasSeasonPickerProps = {
  value: SeasonFilter;
};

export function AtlasSeasonPicker({ value }: AtlasSeasonPickerProps) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <SeasonPicker
      value={value}
      onChange={(next) => {
        router.replace(`${pathname}?season=${next}`);
      }}
    />
  );
}
