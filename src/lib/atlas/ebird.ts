/** Direct eBird species page from the official taxonomy species code. */
export function ebirdSpeciesUrl(speciesCode: string): string {
  return `https://ebird.org/species/${encodeURIComponent(speciesCode)}`;
}
