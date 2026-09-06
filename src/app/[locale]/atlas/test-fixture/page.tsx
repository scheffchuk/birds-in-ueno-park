import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AtlasListView } from "../AtlasListView";
import type { AtlasListSource } from "@/lib/atlas/select";

const browserFixtureSpecies: AtlasListSource[] = [
  {
    slug: "winter-demo-bird",
    sciName: "Demo avis hiemalis",
    comNameEn: "Winter Demo Bird",
    comNameJa: "冬のテスト鳥",
    comNameZhTw: "冬季測試鳥",
    listed: true,
    prevalence: { winter: 100, spring: 40, summer: 0, autumn: 20 },
    audio: {
      status: "available",
      url: "https://audio.test/winter-demo-bird.mp3",
    },
    wikipedia: {
      en: "https://wikipedia.test/wiki/Winter_Demo_Bird",
      ja: "https://wikipedia.test/ja/wiki/Winter_Demo_Bird",
      zhTw: "https://wikipedia.test/zh-tw/Winter_Demo_Bird",
    },
    ebird: {
      speciesCode: "windem1",
      url: "https://ebird.test/species/windem1",
    },
  },
  {
    slug: "summer-demo-bird",
    sciName: "Demo avis aestiva",
    comNameEn: "Summer Demo Bird",
    comNameJa: "夏のテスト鳥",
    comNameZhTw: "夏季測試鳥",
    listed: true,
    prevalence: { winter: 0, spring: 30, summer: 90, autumn: 10 },
    audio: {
      status: "available",
      url: "https://audio.test/summer-demo-bird.mp3",
    },
    wikipedia: {
      en: "https://wikipedia.test/wiki/Summer_Demo_Bird",
      ja: "https://wikipedia.test/ja/wiki/Summer_Demo_Bird",
      zhTw: "https://wikipedia.test/zh-tw/Summer_Demo_Bird",
    },
    ebird: {
      speciesCode: "sumdem1",
      url: "https://ebird.test/species/sumdem1",
    },
  },
  {
    slug: "unavailable-demo-bird",
    sciName: "Demo avis muta",
    comNameEn: "Unavailable Demo Bird",
    comNameJa: "音声なしテスト鳥",
    comNameZhTw: "無聲測試鳥",
    listed: true,
    prevalence: { winter: 35, spring: 0, summer: 0, autumn: 0 },
    audio: {
      status: "unavailable",
      unavailableReason: "Fixture has no recording",
    },
  },
];

/** Dev-only fixture for the Playwright Atlas interaction tests. */
export default function AtlasBrowserFixturePage() {
  if (process.env.BROWSER_TEST_FIXTURES !== "1") notFound();

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <h1 className="font-heading text-2xl text-ink">Atlas browser fixture</h1>
        <Suspense fallback={<div className="min-h-[50vh]" aria-hidden />}>
          <AtlasListView species={browserFixtureSpecies} />
        </Suspense>
      </div>
    </main>
  );
}
