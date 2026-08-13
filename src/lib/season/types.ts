import type { Doc } from "../../../convex/_generated/dataModel";

export type Season = Doc<"prevalence">["season"];

export const SEASONS = [
  "winter",
  "spring",
  "summer",
  "autumn",
] as const satisfies readonly Season[];

export type SeasonFilter = Season | "all";
