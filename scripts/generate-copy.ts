import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { generateSpeciesCopy, type GenerateCopyInput } from "../src/lib/histogram/generate-copy";
import { selectSpeciesForCopy } from "../src/lib/histogram/select-for-copy";
import type { SpeciesCopy } from "../src/lib/histogram/copy-plan";

const root = resolve(import.meta.dirname, "..");

function parseArgs(argv: string[]): { limit?: number; slug?: string; dryRun: boolean } {
  let limit: number | undefined;
  let slug: string | undefined;
  let dryRun = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }
    if (arg === "--limit") {
      const raw = argv[i + 1];
      if (!raw) throw new Error("--limit requires a number");
      limit = Number(raw);
      if (!Number.isFinite(limit) || limit < 1) {
        throw new Error(`Invalid --limit: ${raw}`);
      }
      i += 1;
      continue;
    }
    if (arg?.startsWith("--limit=")) {
      limit = Number(arg.slice("--limit=".length));
      if (!Number.isFinite(limit) || limit < 1) {
        throw new Error(`Invalid --limit: ${arg}`);
      }
      continue;
    }
    if (arg === "--slug") {
      slug = argv[i + 1];
      if (!slug) throw new Error("--slug requires a value");
      i += 1;
      continue;
    }
    if (arg?.startsWith("--slug=")) {
      slug = arg.slice("--slug=".length);
    }
  }

  return { limit, slug, dryRun };
}

async function main() {
  const { limit, slug, dryRun } = parseArgs(process.argv.slice(2));

  if (!process.env.AI_GATEWAY_API_KEY && !dryRun) {
    console.error(
      "AI_GATEWAY_API_KEY is required (routes xAI Grok; no Gemini). Add it to .env.local.",
    );
    process.exit(1);
  }

  const guidePath = resolve(root, "data/guide-species.json");
  const guide = JSON.parse(readFileSync(guidePath, "utf8")) as Array<
    GenerateCopyInput & { slug: string }
  >;
  const selected = selectSpeciesForCopy(guide, { limit, slug });

  if (selected.length === 0) {
    console.error("No species selected. Check --slug / guide-species.json.");
    process.exit(1);
  }

  console.log(
    `Copy generation: ${selected.length} species` +
      (limit ? ` (limit ${limit})` : "") +
      (slug ? ` (slug ${slug})` : "") +
      (dryRun ? " [dry-run]" : ""),
  );

  if (dryRun) {
    for (const s of selected) {
      console.log(`- ${s.slug} (${s.comNameEn})`);
    }
    return;
  }

  const copies: Array<SpeciesCopy & { slug: string }> = [];
  for (const [index, species] of selected.entries()) {
    console.log(`[${index + 1}/${selected.length}] ${species.slug}…`);
    const copy = await generateSpeciesCopy(species);
    copies.push({ slug: species.slug, ...copy });
  }

  mkdirSync(resolve(root, "data"), { recursive: true });
  const outPath = resolve(root, "data/species-copy.json");
  writeFileSync(outPath, JSON.stringify(copies, null, 2) + "\n");
  console.log(`Wrote ${outPath}`);

  if (process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_DEPLOYMENT) {
    const argsJson = JSON.stringify({ copies });
    const result = spawnSync(
      "pnpm",
      ["exec", "convex", "run", "species:seedSpeciesCopy", argsJson],
      {
        cwd: root,
        encoding: "utf8",
        env: process.env,
        maxBuffer: 10 * 1024 * 1024,
      },
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

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
