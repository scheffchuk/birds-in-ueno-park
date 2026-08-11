import type { Season } from "./types";

const TOKYO = "Asia/Tokyo";

/** Meteorological Season for an instant in a given IANA time zone (default Tokyo). */
export function seasonAt(
  instant: Date | number,
  timeZone: string = TOKYO,
): Season {
  const date = typeof instant === "number" ? new Date(instant) : instant;
  const monthPart = new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "numeric",
  })
    .formatToParts(date)
    .find((part) => part.type === "month");
  const month = Number(monthPart?.value);

  if (month === 12 || month === 1 || month === 2) return "winter";
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  return "autumn";
}
