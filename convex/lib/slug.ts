/** Deterministic Slug from scientific name; immutable after create. */
export function slugFromSciName(sciName: string): string {
  return sciName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
