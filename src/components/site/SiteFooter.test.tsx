import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { SiteFooter } from "./SiteFooter";

const footerCopy = vi.hoisted(() => ({
  en: {
    credit: "Inspired by",
    createdBy: "Created by",
    audioCredits: "Audio credits",
  },
  ja: {
    credit: "着想元",
    createdBy: "制作",
    audioCredits: "音声クレジット",
  },
  "zh-tw": {
    credit: "靈感來自",
    createdBy: "製作",
    audioCredits: "聲音致謝",
  },
}));

vi.mock("@/i18n/load-messages", () => ({
  loadMessages: async (locale: keyof typeof footerCopy) => ({
    Footer: footerCopy[locale],
  }),
}));

describe("SiteFooter", () => {
  it.each(["en", "ja", "zh-tw"] as const)(
    "links %s to its localized Audio credits page",
    async (locale) => {
      const markup = renderToStaticMarkup(await SiteFooter({ locale }));

      expect(markup).toContain(`href="/${locale}/audio"`);
      expect(markup).toContain(footerCopy[locale].audioCredits);
    },
  );
});
