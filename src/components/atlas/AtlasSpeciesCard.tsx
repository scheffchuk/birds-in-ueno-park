import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type AtlasSpeciesCardProps = {
  slug: string;
  comNameEn: string;
  sciName: string;
  imageUrl?: string;
  index: number;
};

export function AtlasSpeciesCard({
  slug,
  comNameEn,
  sciName,
  imageUrl,
  index,
}: AtlasSpeciesCardProps) {
  const delayMs = Math.min(index, 12) * 40;

  return (
    <Link
      href={`/atlas/${slug}`}
      className={cn(
        "atlas-card-enter block rounded-xl outline-none transition-transform duration-160 ease-out",
        "focus-visible:ring-3 focus-visible:ring-ring/50",
        "active:scale-[0.98]",
      )}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <Card
        size="sm"
        className="h-full ring-1 ring-hairline shadow-none"
      >
        <div className="px-(--card-spacing) pt-(--card-spacing)">
          <div className="relative aspect-square w-full overflow-hidden">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={comNameEn}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                unoptimized
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
            {comNameEn}
          </CardTitle>
          <CardDescription className="truncate text-xs text-ink-soft italic">
            {sciName}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
