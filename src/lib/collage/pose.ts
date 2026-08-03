/** Deterministic perch/flight choice from Slug (same rule as collage tiles). */
export function collagePoseUrl(bird: {
  slug: string;
  perchUrl?: string;
  flightUrl?: string;
}): string | undefined {
  let h = 0;
  for (let i = 0; i < bird.slug.length; i += 1) {
    h = (h * 31 + bird.slug.charCodeAt(i)) | 0;
  }
  const preferFlight = (h & 1) === 1;
  if (preferFlight && bird.flightUrl) return bird.flightUrl;
  if (bird.perchUrl) return bird.perchUrl;
  return bird.flightUrl;
}
