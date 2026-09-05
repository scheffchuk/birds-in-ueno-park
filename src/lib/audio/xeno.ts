/** Build the tagged v3 query required to search one scientific species name. */
export function xenoCantoQueryForSpecies(scientificName: string): string {
  const [genus, specificEpithet] = scientificName.trim().split(/\s+/);
  if (!genus || !specificEpithet) {
    throw new Error(`Expected a binomial scientific name: ${scientificName}`);
  }
  return `gen:${genus} sp:${specificEpithet}`;
}
