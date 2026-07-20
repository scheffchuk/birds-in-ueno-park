import type { Season } from "./types";

/** Current meteorological Season in Asia/Tokyo (not the visitor's local TZ). */
export function currentTokyoSeason(nowMs: number = Date.now()): Season {
  const month = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Tokyo",
      month: "numeric",
    }).format(new Date(nowMs)),
  );
  if (month === 12 || month <= 2) return "winter";
  if (month <= 5) return "spring";
  if (month <= 8) return "summer";
  return "autumn";
}
