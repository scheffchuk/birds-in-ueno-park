import { cacheLife, cacheTag } from "next/cache";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";
import { GUIDE_SPECIES_TAG } from "./cache-tags";

/**
 * Cached Atlas list payload for Listed Guide species.
 * Hourly TTL; busted via `guide-species` from illustration generate paths.
 * Season filtering stays outside this cache (searchParams hole).
 */
export async function loadAtlasList() {
  "use cache";
  cacheLife("hours");
  cacheTag(GUIDE_SPECIES_TAG);
  return await fetchQuery(api.species.listAtlas);
}
