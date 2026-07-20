/** Public eBird search deep-link for a scientific name (no species-code required). */
export function ebirdSpeciesUrl(sciName: string): string {
  return `https://ebird.org/search?keyword=${encodeURIComponent(sciName)}`;
}
