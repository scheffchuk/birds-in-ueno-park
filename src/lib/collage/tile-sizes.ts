/** Rough stage width per breakpoint — turns a tile's share into a source width. */
const STAGE_WIDTH_PX = { portrait: 370, landscape: 1100 } as const;
const SIZE_STEP_PX = 32;

function sourceWidth(widthPct: number, stageWidth: number): number {
  const px = (widthPct / 100) * stageWidth;
  return Math.max(SIZE_STEP_PX, Math.ceil(px / SIZE_STEP_PX) * SIZE_STEP_PX);
}

/**
 * `sizes` for a tile whose share differs between the two canvases. Kept clear
 * of the packer so the collage view doesn't pull it into the client bundle.
 */
export function tileSizes(portraitPct: number, landscapePct: number): string {
  const small = sourceWidth(portraitPct, STAGE_WIDTH_PX.portrait);
  const large = sourceWidth(landscapePct, STAGE_WIDTH_PX.landscape);
  return `(max-width: 767px) ${small}px, ${large}px`;
}
