import Image from "next/image";
import Link from "next/link";
import { ebirdSpeciesUrl } from "@/lib/atlas/ebird";
import type { SpeciesRecord } from "@/lib/collage/types";
import { PrevalenceChart } from "@/components/atlas/PrevalenceChart";

type AtlasDetailViewProps = {
  species: SpeciesRecord;
};

function hasText(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function AtlasDetailView({ species }: AtlasDetailViewProps) {
  const hasDescription =
    hasText(species.descriptionEn) ||
    hasText(species.descriptionJa) ||
    hasText(species.descriptionZhTw);
  const hasTips =
    hasText(species.spottingTipsEn) ||
    hasText(species.spottingTipsJa) ||
    hasText(species.spottingTipsZhTw);
  const hasArt = Boolean(species.perchUrl || species.flightUrl);

  return (
    <div className="flex flex-1 flex-col gap-10">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-3xl tracking-tight text-ink md:text-4xl">
          {species.comNameEn}
        </h1>
        <p className="text-lg text-ink-2">{species.comNameJa}</p>
        <p className="text-lg text-ink-2">{species.comNameZhTw}</p>
        <p className="text-sm text-ink-soft italic">{species.sciName}</p>
      </header>

      {hasArt ? (
        <section
          className="grid grid-cols-1 gap-8 sm:grid-cols-2"
          aria-label="Illustrations"
        >
          {species.perchUrl ? (
            <figure className="flex flex-col items-center gap-2">
              <div className="relative aspect-square w-full max-w-xs">
                <Image
                  src={species.perchUrl}
                  alt={`${species.comNameEn} perched`}
                  fill
                  sizes="320px"
                  className="object-contain"
                  unoptimized
                  priority
                />
              </div>
              <figcaption className="font-mono text-[10px] tracking-[0.14em] text-ink-soft uppercase">
                Perched 止まり
              </figcaption>
            </figure>
          ) : null}
          {species.flightUrl ? (
            <figure className="flex flex-col items-center gap-2">
              <div className="relative aspect-square w-full max-w-xs">
                <Image
                  src={species.flightUrl}
                  alt={`${species.comNameEn} in flight`}
                  fill
                  sizes="320px"
                  className="object-contain"
                  unoptimized
                />
              </div>
              <figcaption className="font-mono text-[10px] tracking-[0.14em] text-ink-soft uppercase">
                Flight 飛翔
              </figcaption>
            </figure>
          ) : null}
        </section>
      ) : null}

      {hasDescription ? (
        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-xl text-ink">About / 概要</h2>
          <CopyBlock lang="EN" text={species.descriptionEn} />
          <CopyBlock lang="JA" text={species.descriptionJa} />
          <CopyBlock lang="ZH-TW" text={species.descriptionZhTw} />
        </section>
      ) : null}

      {hasTips ? (
        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-xl text-ink">
            Spotting tips / 観察のヒント
          </h2>
          <CopyBlock lang="EN" text={species.spottingTipsEn} />
          <CopyBlock lang="JA" text={species.spottingTipsJa} />
          <CopyBlock lang="ZH-TW" text={species.spottingTipsZhTw} />
        </section>
      ) : null}

      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-xl text-ink">Prevalence by Season</h2>
        <PrevalenceChart prevalence={species.prevalence} />
      </section>

      <p>
        <a
          href={ebirdSpeciesUrl(species.sciName)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex rounded-full bg-paper-2 px-4 py-2 font-mono text-[10px] tracking-[0.14em] text-ink uppercase shadow-[var(--recess)] transition-colors hover:text-ink-2"
        >
          View on eBird
        </a>
      </p>

      <Link
        href="/"
        className="font-mono text-[10px] tracking-[0.18em] text-ink-soft uppercase transition-colors hover:text-ink"
      >
        ← Collage コラージュ
      </Link>
    </div>
  );
}

function CopyBlock({
  lang,
  text,
}: {
  lang: string;
  text: string | undefined;
}) {
  if (!hasText(text)) return null;
  return (
    <div className="flex flex-col gap-1">
      <p className="font-mono text-[10px] font-medium tracking-[0.14em] text-ink-soft uppercase">
        {lang}
      </p>
      <p className="text-base leading-relaxed whitespace-pre-wrap text-ink-2">
        {text}
      </p>
    </div>
  );
}
