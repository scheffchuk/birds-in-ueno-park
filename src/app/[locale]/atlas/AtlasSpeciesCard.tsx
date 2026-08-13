import Image from "next/image";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/navigation";
import { hrefWithSeason } from "@/lib/season/url";
import type { SeasonFilter } from "@/lib/season/types";
import { cn } from "@/lib/utils";

export function AtlasSpeciesCard({
  slug,
  comName,
  sciName,
  imageUrl,
  index,
  season,
}: {
  slug: string;
  comName: string;
  sciName: string;
  imageUrl?: string;
  index: number;
  season?: SeasonFilter;
}) {
  const delayMs = Math.min(index, 12) * 40;

  return (
    <Link
      href={hrefWithSeason(`/atlas/${slug}`, season)}
      className={cn(
        "atlas-card-enter block rounded-xl outline-none transition-transform duration-160 ease-out",
        "focus-visible:ring-3 focus-visible:ring-ring/50",
        "active:scale-[0.98]",
      )}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <Card size="sm" className="h-full ring-1 ring-hairline shadow-none">
        <div className="px-(--card-spacing) pt-(--card-spacing)">
          <div className="relative aspect-square w-full overflow-hidden">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={comName}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 288px"
                loading={index < 4 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : "auto"}
                className="object-contain"
              />
            ) : (
              <div
                className="absolute inset-[12%] rounded-[40%_40%_35%_35%] bg-silhouette/25"
                aria-hidden
              />
            )}
          </div>
        </div>
        <Separator className="mx-auto w-[90%] self-center bg-hairline opacity-50 data-horizontal:w-[90%]" />
        <CardHeader className="gap-0.5">
          <CardTitle className="line-clamp-2 text-sm leading-snug text-ink">
            {comName}
          </CardTitle>
          <CardDescription className="truncate text-xs text-ink-soft italic">
            {sciName}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
