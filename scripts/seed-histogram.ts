import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { buildGuideSpecies } from "../src/lib/histogram/build";
import { guideSpeciesToReviewCsv } from "../src/lib/histogram/review-csv";
import type { GuideSpeciesSeed } from "../src/lib/histogram/types";

const root = resolve(import.meta.dirname, "..");

const SCI_ALIASES: Record<string, string> = {
  // eBird "Asian Tit" vs BirdNET/labels "Japanese Tit"
  "Parus cinereus": "Parus minor",
};

function loadLabels(path: string): Record<string, string> {
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, string>;
}

function withAliases(labels: Record<string, string>): Record<string, string> {
  const out = { ...labels };
  for (const [from, to] of Object.entries(SCI_ALIASES)) {
    if (labels[to] && !out[from]) out[from] = labels[to];
  }
  return out;
}

function main() {
  const ueno = readFileSync(
    resolve(root, "data/ebird/L920322-ueno-park.tsv"),
    "utf8",
  );
  const shinobazu = readFileSync(
    resolve(root, "data/ebird/L920941-shinobazu-pond.tsv"),
    "utf8",
  );
  const exotic = JSON.parse(
    readFileSync(resolve(root, "data/ebird/exotic-flags.json"), "utf8"),
  ) as Record<string, string>;

  const ja = withAliases(
    loadLabels(resolve(root, "temp/model/l18n/labels_ja.json")),
  );
  const zhTw = withAliases(
    loadLabels(resolve(root, "temp/model/l18n/labels_zh_TW.json")),
  );

  const guide = buildGuideSpecies({
    tsvTexts: [ueno, shinobazu],
    exoticBySciName: exotic,
    names: { ja, zhTw },
  });

  mkdirSync(resolve(root, "data"), { recursive: true });
  writeFileSync(
    resolve(root, "data/guide-species.json"),
    JSON.stringify(guide, null, 2) + "\n",
  );
  writeFileSync(
    resolve(root, "data/guide-species-review.csv"),
    guideSpeciesToReviewCsv(guide),
  );

  writeFixtureTs(guide);
  console.log(`Guide species: ${guide.length}`);
  console.log("Wrote data/guide-species.json, data/guide-species-review.csv");
  console.log("Wrote src/lib/fixtures/guide-species.ts");

  if (process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_DEPLOYMENT) {
    const argsJson = JSON.stringify({ species: guide });
    const result = spawnSync(
      "pnpm",
      ["exec", "convex", "run", "species:seedGuideSpecies", argsJson],
      { cwd: root, encoding: "utf8", env: process.env, maxBuffer: 10 * 1024 * 1024 },
    );
    if (result.status !== 0) {
      console.error(result.stderr || result.stdout);
      process.exit(result.status ?? 1);
    }
    console.log("Convex seed:", result.stdout.trim());
  } else {
    console.log("Skip Convex seed (no CONVEX_DEPLOYMENT)");
  }
}

function writeFixtureTs(guide: GuideSpeciesSeed[]) {
  const records = guide.map((g) => ({
    slug: g.slug,
    sciName: g.sciName,
    comNameEn: g.comNameEn,
    comNameJa: g.comNameJa,
    comNameZhTw: g.comNameZhTw,
    listed: true,
    illustrationStatus: "queued" as const,
    prevalence: g.prevalence,
  }));
  const body = `import type { SpeciesRecord } from "@/lib/guide/types";

/** Guide species seeded from merged eBird histograms (Ueno + Shinobazu). */
export const FIXTURE_SPECIES: SpeciesRecord[] = ${JSON.stringify(records, null, 2)};
`;
  writeFileSync(resolve(root, "src/lib/fixtures/guide-species.ts"), body);
}

main();
