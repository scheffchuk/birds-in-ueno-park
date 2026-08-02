import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ebirdSpeciesUrl } from "@/lib/atlas/ebird";
import type { SpeciesRecord } from "@/lib/collage/types";
import {
  longFormForLocale,
  nameStackForLocale,
} from "@/lib/locale/species";
import { PrevalenceChart } from "@/components/atlas/PrevalenceChart";
import { BackLink } from "@/components/site/BackLink";
import type { AppLocale } from "@/i18n/routing";

type AtlasDetailViewProps = {
  species: SpeciesRecord;
  locale: AppLocale;
};

function hasText(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function AtlasDetailView({
  species,
  locale,
}: AtlasDetailViewProps) {
  const t = await getTranslations("AtlasDetail");
  const tNav = await getTranslations("Nav");
  const stack = nameStackForLocale(species, locale);
  const description = longFormForLocale(species, "description", locale);
  const spottingTips = longFormForLocale(species, "spottingTips", locale);
  const hasArt = Boolean(species.perchUrl || species.flightUrl);

  return (
    <div className="flex flex-1 flex-col gap-10">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-3xl tracking-tight text-ink md:text-4xl">
          {stack.primary}
        </h1>
        {stack.secondary.map((name) => (
          <p key={name} className="text-lg text-ink-2">
            {name}
          </p>
        ))}
        <p className="text-sm text-ink-soft italic">{stack.scientific}</p>
      </header>

      {hasArt ? (
        <section
          className="grid grid-cols-1 gap-8 sm:grid-cols-2"
          aria-label={t("illustrations")}
        >
          {species.perchUrl ? (
            <figure className="flex flex-col items-center gap-2">
              <div className="relative aspect-square w-full max-w-xs">
                <Image
                  src={species.perchUrl}
                  alt={t("altPerched", { name: stack.primary })}
                  fill
                  sizes="320px"
                  className="object-contain"
                  loading="eager"
                  fetchPriority="high"
                />
              </div>
              <figcaption className="font-mono text-[10px] tracking-[0.14em] text-ink-soft uppercase">
                {t("perched")}
              </figcaption>
            </figure>
          ) : null}
          {species.flightUrl ? (
            <figure className="flex flex-col items-center gap-2">
              <div className="relative aspect-square w-full max-w-xs">
                <Image
                  src={species.flightUrl}
                  alt={t("altFlight", { name: stack.primary })}
                  fill
                  sizes="320px"
                  className="object-contain"
                  loading="eager"
                  fetchPriority={species.perchUrl ? "auto" : "high"}
                />
              </div>
              <figcaption className="font-mono text-[10px] tracking-[0.14em] text-ink-soft uppercase">
                {t("flight")}
              </figcaption>
            </figure>
          ) : null}
        </section>
      ) : null}

      {hasText(description) ? (
        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-xl text-ink">{t("about")}</h2>
          <p className="text-base leading-relaxed whitespace-pre-wrap text-ink-2">
            {description}
          </p>
        </section>
      ) : null}

      {hasText(spottingTips) ? (
        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-xl text-ink">{t("spottingTips")}</h2>
          <p className="text-base leading-relaxed whitespace-pre-wrap text-ink-2">
            {spottingTips}
          </p>
        </section>
      ) : null}

      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-xl text-ink">{t("prevalence")}</h2>
        <PrevalenceChart prevalence={species.prevalence} />
      </section>

      <p>
        <a
          href={ebirdSpeciesUrl(species.sciName)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex rounded-full bg-paper-2 px-4 py-2 font-mono text-[10px] tracking-[0.14em] text-ink uppercase shadow-[var(--recess)] transition-colors hover:text-ink-2"
        >
          {t("viewOnEbird")}
        </a>
      </p>

      <BackLink href="/" label={tNav("backToCollage")} />
    </div>
  );
}
