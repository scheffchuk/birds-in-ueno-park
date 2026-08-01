# Locale routing via next-intl; species copy stays in Convex

The public guide is trilingual (EN / JA / ZH-TW) but visitors pick a **Locale** that drives UI chrome and primary long-form species fields, while other common names stay visible on detail pages (hybrid, not monolingual wipe). We use **next-intl** with **always-prefixed** paths (`/ja`, `/en`, `/zh-tw`); cold `/` and legacy unprefixed public URLs negotiate `Accept-Language` among those three and otherwise land on **JA**. `/admin` stays English and outside the locale tree.

Species names and prose remain parallel Convex fields (`*En` / `*Ja` / `*ZhTw`) — curated/seeded domain data, editable without deploy. next-intl message catalogs own finite UI chrome only. Missing long-form for the active Locale falls back to **EN only**, never a third Locale. Dense UI (collage hover, atlas cards) shows the Locale common name only; the full name stack is detail-only.

Considered and rejected: cookie-only Locale (breaks shareable language), unprefixed default JA (`as-needed` — ambiguous canonical URLs), moving species strings into message files or a locale CMS (fights admin/seed), normalizing to a translations child table before shipping routing (optional later tidy), and `next-i18next` / hand-rolled dictionaries (worse App Router fit for the routing glue we still need).
