import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import audioManifestData from "../../../data/audio-manifest.json";
import { AudioCredits, type AudioCreditLabels } from "./AudioCredits";
import {
  audioCreditsForManifest,
  type AudioCredit,
} from "@/lib/audio/credits";
import type { AppLocale } from "@/i18n/routing";
import type { AudioManifest } from "@/lib/audio/types";

const credit: AudioCredit = {
  slug: "parus-major",
  sciName: "Parus major",
  names: {
    comNameEn: "Great Tit",
    comNameJa: "シジュウカラ",
    comNameZhTw: "大山雀",
  },
  recordist: "A Recordist",
  catalogueNumber: "123456",
  sourceUrl: "https://xeno-canto.org/123456",
  licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
  license: "CC BY",
};

const localizedCases: {
  locale: AppLocale;
  name: string;
  labels: AudioCreditLabels;
}[] = [
  {
    locale: "en",
    name: "Great Tit",
    labels: {
      recordist: "Recordist",
      catalogue: "Catalogue",
      source: "Source recording",
      license: "Licence",
      none: "No credits",
    },
  },
  {
    locale: "ja",
    name: "シジュウカラ",
    labels: {
      recordist: "録音者",
      catalogue: "カタログ番号",
      source: "音源",
      license: "ライセンス",
      none: "音声クレジットなし",
    },
  },
  {
    locale: "zh-tw",
    name: "大山雀",
    labels: {
      recordist: "錄音者",
      catalogue: "目錄編號",
      source: "來源錄音",
      license: "授權",
      none: "沒有致謝",
    },
  },
];

const manifest = audioManifestData as AudioManifest;
const manifestCredits = audioCreditsForManifest(manifest);

function renderedText(value: string): string {
  return value.replaceAll("&", "&amp;");
}

describe("AudioCredits", () => {
  it.each(localizedCases)(
    "renders $locale attribution labels and values",
    ({ locale, name, labels }) => {
      const markup = renderToStaticMarkup(
        <AudioCredits
          locale={locale}
          credits={[credit]}
          labels={labels}
        />,
      );

      expect(markup).toContain(name);
      expect(markup).toContain(labels.recordist);
      expect(markup).toContain(labels.catalogue);
      expect(markup).toContain(labels.source);
      expect(markup).toContain(labels.license);
      expect(markup).toContain("A Recordist");
      expect(markup).toContain("123456");
      expect(markup).toContain("CC BY");
      expect(markup).toContain('href="https://xeno-canto.org/123456"');
      expect(markup).toContain(
        'href="https://creativecommons.org/licenses/by/4.0/"',
      );
      expect(markup).toContain('target="_blank"');
      expect(markup).toContain('rel="noopener noreferrer"');
    },
  );

  it("renders the empty state when no recordings are available", () => {
    expect(
      renderToStaticMarkup(
        <AudioCredits
          locale="en"
          credits={[]}
          labels={{
            recordist: "Recordist",
            catalogue: "Catalogue",
            source: "Source recording",
            license: "Licence",
            none: "No credits",
          }}
        />,
      ),
    ).toContain("No credits");
  });

  it("renders every attribution field from the committed manifest", () => {
    const markup = renderToStaticMarkup(
    <AudioCredits
      locale="en"
      credits={manifestCredits}
      labels={localizedCases[0].labels}
    />,
  );
    const rows = markup.match(/<li\b[^>]*>[\s\S]*?<\/li>/g) ?? [];
    const availableEntries = manifest.species.filter(
      (entry) => entry.audio.status === "available",
    );

    expect(manifestCredits).toHaveLength(availableEntries.length);
    expect(rows).toHaveLength(availableEntries.length);
    availableEntries.forEach((entry, index) => {
      const row = rows[index];
      if (!row || entry.audio.status !== "available") return;

      expect(row).toContain(renderedText(entry.comNameEn));
      expect(row).toContain(renderedText(entry.sciName));
      expect(row).toContain(renderedText(entry.audio.recordist));
      expect(row).toContain(renderedText(entry.audio.catalogueNumber));
      expect(row).toContain(renderedText(entry.audio.license));
      expect(row).toContain(`href="${entry.audio.sourceUrl}"`);
      expect(row).toContain(`href="${entry.audio.licenseUrl}"`);
    });
  });
});
