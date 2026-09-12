// @vitest-environment jsdom
import * as React from "react";
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { AtlasSpeciesCard } from "./AtlasSpeciesCard";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) =>
    ({
      playAudio: "Play audio",
      pauseAudio: "Pause audio",
      loadingAudio: "Loading audio",
      retryAudio: "Retry audio",
      audioUnavailable: "Audio unavailable",
      wikipedia: "Wikipedia",
      ebird: "eBird",
      opensNewTab: "opens in a new tab",
    })[key] ?? key,
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...props
  }: {
    href: string | { pathname: string };
    children: React.ReactNode;
  }) => (
    <a href={typeof href === "string" ? href : href.pathname} {...props}>
      {children}
    </a>
  ),
}));

const wikipedia = {
  en: "https://en.wikipedia.org/wiki/Tree_sparrow",
  ja: "https://ja.wikipedia.org/wiki/スズメ",
  zhTw: "https://zh.wikipedia.org/zh-tw/麻雀",
};

const ebird = {
  speciesCode: "eurtrs1",
  url: "https://ebird.org/species/eurtrs1",
};

let roots: Array<{ root: Root; container: HTMLDivElement }> = [];

function renderCard() {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push({ root, container });

  act(() => {
    root.render(
      <AtlasSpeciesCard
        slug="passer-montanus"
        comName="スズメ"
        sciName="Passer montanus"
        imageUrl="https://images.example/sparrow.png"
        index={0}
        season="spring"
        locale="ja"
        audio={{
          status: "available",
          url: "https://audio.example/sparrow.mp3",
        }}
        wikipedia={wikipedia}
        ebird={ebird}
      />,
    );
  });

  return container;
}

afterEach(() => {
  for (const { root, container } of roots) {
    act(() => root.unmount());
    container.remove();
  }
  roots = [];
  vi.clearAllMocks();
});

describe("AtlasSpeciesCard", () => {
  it("does not shrink the card on press", () => {
    const container = renderCard();
    const card = container.querySelector('[data-slot="card"]');

    expect(card?.className).not.toContain("active:scale");
    expect(card?.className).not.toContain("transition-transform");
    expect(card?.className).toContain("shadow-[var(--raised)]");
    expect(card?.className).not.toContain("ring-hairline");
    expect(card?.className).not.toContain("focus-within:");
  });

  it("keeps the detail link on the illustration and Locale common name", () => {
    const container = renderCard();
    const detailLink = container.querySelector("a") as HTMLAnchorElement;

    expect(detailLink.querySelector("img")).not.toBeNull();
    expect(detailLink.textContent).toContain("スズメ");
    expect(detailLink.textContent).not.toContain("Passer montanus");
    expect(container.textContent).toContain("Passer montanus");
  });

  it("keeps audio, Wikipedia, and eBird as separate keyboard controls", () => {
    const container = renderCard();
    const buttons = [...container.querySelectorAll("button")];
    const links = [...container.querySelectorAll("a")];

    expect(buttons).toHaveLength(1);
    expect(buttons[0]?.type).toBe("button");
    expect(buttons[0]?.getAttribute("aria-label")).toBe("Play audio");
    expect(buttons[0]?.textContent).toBe("");
    expect(buttons[0]?.querySelector("svg")).not.toBeNull();
    expect(container.querySelector("img")?.className).toContain(
      "atlas-card-specimen",
    );
    expect(
      container.querySelector(".flex.items-center.justify-between"),
    ).not.toBeNull();
    expect(links.map((link) => link.textContent?.trim())).toEqual([
      "スズメ",
      "Wikipedia",
      "eBird",
    ]);
    for (const link of links.slice(1)) {
      expect(link.getAttribute("aria-label")).toContain("opens in a new tab");
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    }
  });
});
