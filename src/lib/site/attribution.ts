/** Site-wide footer + About copy (EN + JA chrome; no ZH-TW body). */

export const SITE_FOOTER = {
  prevalence:
    "Bird size reflects seasonal Prevalence from eBird checklists at Ueno Park and Shinobazu Pond.",
  prevalenceJa:
    "鳥の大きさは、上野公園・不忍池の eBird チェックリストに基づく季節ごとの出現度（Prevalence）を示します。",
  credit: "Collage UI inspired by AvianVisitors",
  creditUrl: "https://github.com/Twarner491/AvianVisitors",
  creditSite: "theodore.net",
  creditSiteUrl: "https://theodore.net",
} as const;

export const ABOUT_SECTIONS = [
  {
    id: "collage",
    titleEn: "What the collage shows",
    titleJa: "コラージュについて",
    bodyEn:
      "Each bird is sized by Prevalence — how often that species appears on eBird checklists at Ueno Park and Shinobazu Pond in the selected Season. Winter, Spring, Summer, and Autumn follow the calendar in Asia/Tokyo. All year uses each species’ highest seasonal Prevalence.",
    bodyJa:
      "各鳥の大きさは Prevalence（出現度）— 選んだ季節に上野公園・不忍池の eBird チェックリストでその種がどのくらい記録されるか — を表します。冬・春・夏・秋は Asia/Tokyo の暦に従います。「通年」は各種の季節最大値を使います。",
  },
  {
    id: "data",
    titleEn: "Data source",
    titleJa: "データについて",
    bodyEn:
      "Prevalence comes from curated eBird histogram exports for this site. The Guide is a fixed list of species; values can be hand-tuned in admin when passage weeks need care. Atlas pages link out to eBird for full species accounts.",
    bodyJa:
      "Prevalence は、この場所向けに整理した eBird ヒストグラムから算出しています。図鑑の種リストは固定で、渡り時期などは管理画面で手調整できます。各種ページから eBird の種ページへリンクしています。",
  },
  {
    id: "art",
    titleEn: "Illustrations",
    titleJa: "イラストについて",
      bodyEn:
      "Cutouts follow a kachō-e (bird-and-flower) print style, generated with anatomy references and human review before they appear on the collage. The packing layout and collage interaction are inspired by AvianVisitors (theodore.net).",
    bodyJa:
      "切り抜きイラストは花鳥画の表現を参考にし、解剖写真を参照して生成したうえで人の確認後にコラージュへ載せています。配置と操作感は AvianVisitors（theodore.net）に着想を得ています。",
  },
  {
    id: "scope",
    titleEn: "What this is not",
    titleJa: "このサイトにないもの",
    bodyEn:
      "There is no live microphone, no runtime AI chat, and no community feed in v1 — a curated static guide for visiting the park.",
    bodyJa:
      "v1 にライブマイク・実行時 AI チャット・コミュニティフィードはありません。公園を訪れる方向けのキュレーションされた静的ガイドです。",
  },
] as const;
