import type { CollageBird, PackedBird } from "./types";

const COUNT_EXP = 0.55;
const PACKING_BUDGET_FRAC = 0.55;
const MIN_TILE_AREA_FRAC = 0.012;
const GAP = 8;

type Sized = CollageBird & { width: number; height: number };

function sizeTiles(birds: CollageBird[], viewportW: number, viewportH: number): Sized[] {
  const vpArea = viewportW * viewportH;
  const budget = vpArea * PACKING_BUDGET_FRAC;
  const minArea = vpArea * MIN_TILE_AREA_FRAC;

  const scored = birds.map((bird) => ({
    bird,
    score: Math.pow(Math.max(1, bird.prevalence), COUNT_EXP),
  }));
  const sumScore = scored.reduce((a, t) => a + t.score, 0) || 1;

  const tiles = scored.map(({ bird, score }) => {
    const area = Math.max(minArea, (budget * score) / sumScore);
    const width = Math.sqrt(area * bird.aspect);
    return { ...bird, width, height: width / bird.aspect };
  });

  const sumA = tiles.reduce((a, t) => a + t.width * t.height, 0);
  if (sumA > budget) {
    const fixedSum = tiles
      .filter((t) => t.width * t.height <= minArea + 1e-9)
      .reduce((a, t) => a + t.width * t.height, 0);
    const flexSum = sumA - fixedSum;
    const flexBudget = Math.max(0, budget - fixedSum);
    const shrink = flexSum > 0 ? Math.min(1, flexBudget / flexSum) : 1;
    for (const t of tiles) {
      if (t.width * t.height > minArea + 1e-9) {
        const scale = Math.sqrt(shrink);
        t.width *= scale;
        t.height *= scale;
      }
    }
  }

  return tiles;
}

function overlaps(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
): boolean {
  return (
    a.x < b.x + b.width + GAP &&
    a.x + a.width + GAP > b.x &&
    a.y < b.y + b.height + GAP &&
    a.y + a.height + GAP > b.y
  );
}

function tryPlace(
  tiles: Sized[],
  viewportW: number,
  viewportH: number,
): PackedBird[] | null {
  const placed: PackedBird[] = [];
  const cx = viewportW / 2;
  const cy = viewportH / 2;

  for (const tile of tiles) {
    let found: { x: number; y: number } | null = null;
    const maxR = Math.hypot(viewportW, viewportH);
    for (let r = 0; r <= maxR && !found; r += 4) {
      const steps = Math.max(8, Math.ceil((2 * Math.PI * r) / 8));
      for (let s = 0; s < steps; s++) {
        const angle = (s / steps) * 2 * Math.PI;
        const x = cx + Math.cos(angle) * r - tile.width / 2;
        const y = cy + Math.sin(angle) * r - tile.height / 2;
        if (x < 0 || y < 0 || x + tile.width > viewportW || y + tile.height > viewportH) {
          continue;
        }
        const candidate = { x, y, width: tile.width, height: tile.height };
        if (placed.every((p) => !overlaps(candidate, p))) {
          found = { x, y };
          break;
        }
      }
    }
    if (!found) return null;
    placed.push({ ...tile, x: found.x, y: found.y });
  }
  return placed;
}

/** Pack CollageBirds into a viewport; Prevalence drives relative size. Deterministic. */
export function packCollage(
  birds: CollageBird[],
  viewportW: number,
  viewportH: number,
): PackedBird[] {
  if (birds.length === 0 || viewportW <= 0 || viewportH <= 0) return [];

  let tiles = sizeTiles(birds, viewportW, viewportH);
  for (let iter = 0; iter < 12; iter++) {
    const placed = tryPlace(tiles, viewportW, viewportH);
    if (placed) return placed;
    tiles = tiles.map((t) => ({
      ...t,
      width: t.width * 0.9,
      height: t.height * 0.9,
    }));
  }
  return [];
}
