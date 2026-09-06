import type { ReactNode } from "react";
import { commonNameForLocale } from "@/lib/locale/species";
import type { AppLocale } from "@/i18n/routing";
import { safeExternalUrl, type AudioCredit } from "@/lib/audio/credits";

export type AudioCreditLabels = {
  recordist: string;
  catalogue: string;
  source: string;
  license: string;
  none: string;
};

function CreditLink({ href, children }: { href: string; children: ReactNode }) {
  const safeHref = safeExternalUrl(href);
  if (!safeHref) return <span>{children}</span>;

  return (
    <a
      href={safeHref}
      target="_blank"
      rel="noopener noreferrer"
      className="underline underline-offset-4 hover:text-ink"
    >
      {children}
    </a>
  );
}

export function AudioCredits({
  locale,
  credits,
  labels,
}: {
  locale: AppLocale;
  credits: readonly AudioCredit[];
  labels: AudioCreditLabels;
}) {
  if (credits.length === 0) {
    return <p className="text-sm text-ink-soft">{labels.none}</p>;
  }

  return (
    <ol className="flex flex-col gap-5">
      {credits.map((credit) => (
        <li
          key={credit.slug}
          className="border-t border-hairline pt-4 first:border-t-0 first:pt-0"
        >
          <h3 className="font-heading text-lg text-ink">
            {commonNameForLocale(credit.names, locale)}
          </h3>
          <p className="text-sm text-ink-soft italic">{credit.sciName}</p>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm text-ink-2">
            <dt>{labels.recordist}</dt>
            <dd>{credit.recordist}</dd>
            <dt>{labels.catalogue}</dt>
            <dd>{credit.catalogueNumber}</dd>
            <dt>{labels.source}</dt>
            <dd>
              <CreditLink href={credit.sourceUrl}>
                xeno-canto #{credit.catalogueNumber}
              </CreditLink>
            </dd>
            <dt>{labels.license}</dt>
            <dd>
              <CreditLink href={credit.licenseUrl}>{credit.license}</CreditLink>
            </dd>
          </dl>
        </li>
      ))}
    </ol>
  );
}
