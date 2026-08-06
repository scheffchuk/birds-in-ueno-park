import { cacheLife, cacheTag } from "next/cache";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";
import { GUIDE_SPECIES_TAG } from "@/lib/atlas/cache-tags";

/**
 * Cached collage payload for Listed Guide species with approved art.
 * Hourly TTL; busted via `guide-species` from illustration generate paths.
 * Season filtering stays client-side (`?season=` + packing).
 */
export async function loadForCollage() {
  "use cache";
  cacheLife("hours");
  cacheTag(GUIDE_SPECIES_TAG);
  return await fetchQuery(api.species.listForCollage);
}
