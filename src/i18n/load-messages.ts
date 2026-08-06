import { cacheLife } from "next/cache";
import type { AppLocale } from "./routing";

/** Static message catalogs — safe for the Partial Prerender shell. */
export async function loadMessages(locale: AppLocale) {
  "use cache";
  cacheLife("max");
  return (await import(`../../messages/${locale}.json`)).default;
}
