/** Namespaces read by client components via next-intl `useTranslations`. */
export const CLIENT_MESSAGE_NAMESPACES = [
  "Collage",
  "Season",
  "Atlas",
  "AtlasDetail",
  "LocaleSwitcher",
] as const;

export type ClientMessageNamespace = (typeof CLIENT_MESSAGE_NAMESPACES)[number];

/** Slice of the Locale catalog safe to serialize into NextIntlClientProvider. */
export function pickClientMessages(
  messages: Record<string, unknown>,
): Partial<Record<ClientMessageNamespace, unknown>> {
  const picked: Partial<Record<ClientMessageNamespace, unknown>> = {};
  for (const key of CLIENT_MESSAGE_NAMESPACES) {
    if (key in messages) {
      picked[key] = messages[key];
    }
  }
  return picked;
}
