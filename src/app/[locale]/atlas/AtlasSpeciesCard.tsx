"use client";

import Image from "next/image";
import { ExternalLinkIcon } from "lucide-react";
import { useTranslations } from "next-intl";
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
import { AtlasAudioControl } from "@/components/atlas/AtlasAudioControl";
import { wikipediaUrlForLocale } from "@/lib/audio/links";
import type {
  PublicAudio,
  PublicEbirdLink,
  PublicWikipediaLinks,
} from "@/lib/audio/types";
import type { AppLocale } from "@/i18n/routing";

export function AtlasSpeciesCard({
  slug,
  comName,
  sciName,
  imageUrl,
  index,
  season,
  locale,
  audio,
  ebird,
  wikipedia,
  onPlayRequest,
  onPause,
  onEnded,
  onError,
  onAudioElement,
}: {
  slug: string;
  comName: string;
  sciName: string;
  imageUrl?: string;
  index: number;
  season?: SeasonFilter;
  locale: AppLocale;
  audio?: PublicAudio;
  ebird?: PublicEbirdLink;
  wikipedia?: PublicWikipediaLinks;
  onPlayRequest?: (audio: HTMLAudioElement) => void;
  onPause?: () => void;
  onEnded?: () => void;
  onError?: () => void;
  onAudioElement?: (audio: HTMLAudioElement | null) => void;
}) {
  const t = useTranslations("Atlas");
  const delayMs = Math.min(index, 12) * 40;
  const detailHref = hrefWithSeason(`/atlas/${slug}`, season);
  const wikipediaUrl = wikipediaUrlForLocale(wikipedia, locale);
  const hasAudio = audio?.status === "available" && Boolean(audio.url);

  return (
    <Card
      size="sm"
      className={cn(
        "atlas-card-enter h-full overflow-hidden ring-1 ring-hairline shadow-none",
        "transition-transform duration-160 ease-out",
        "focus-within:ring-ring/50",
        "active:scale-[0.98]",
      )}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <Link
        href={detailHref}
        className="block rounded-t-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
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
        <CardHeader className="gap-0.5">
          <CardTitle className="line-clamp-2 text-sm leading-snug text-ink">
            {comName}
          </CardTitle>
          <CardDescription className="truncate text-xs text-ink-soft italic">
            {sciName}
          </CardDescription>
        </CardHeader>
      </Link>
      <Separator className="mx-auto w-[90%] self-center bg-hairline opacity-50 data-horizontal:w-[90%]" />
      <div className="flex flex-wrap items-center gap-1 px-3 py-2">
        <AtlasAudioControl
          audioUrl={audio?.url}
          available={hasAudio}
          labels={{
            play: t("playAudio"),
            pause: t("pauseAudio"),
            loading: t("loadingAudio"),
            retry: t("retryAudio"),
            unavailable: t("audioUnavailable"),
          }}
          onPlayRequest={onPlayRequest}
          onPause={onPause}
          onEnded={onEnded}
          onError={onError}
          onAudioElement={onAudioElement}
        />
        {wikipediaUrl ? (
          <a
            href={wikipediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${t("wikipedia")} (${t("opensNewTab")})`}
            className="inline-flex h-7 items-center gap-1 rounded-lg px-2 text-[0.7rem] text-ink-soft underline-offset-4 transition-colors hover:text-ink hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <span>{t("wikipedia")}</span>
            <ExternalLinkIcon aria-hidden className="size-3" />
          </a>
        ) : null}
        {ebird?.url ? (
          <a
            href={ebird.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${t("ebird")} (${t("opensNewTab")})`}
            className="inline-flex h-7 items-center gap-1 rounded-lg px-2 text-[0.7rem] text-ink-soft underline-offset-4 transition-colors hover:text-ink hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <span>{t("ebird")}</span>
            <ExternalLinkIcon aria-hidden className="size-3" />
          </a>
        ) : null}
      </div>
    </Card>
  );
}
