# Birds in Ueno

A curated, trilingual (EN / JA / ZH-TW) bird guide for Ueno Park, Tokyo. A collage view sizes bird illustrations by how often each species is encountered, filtered by season. Visually forked from AvianVisitors, reimplemented on Next.js + Convex.

## Language

**Prevalence**:
How frequently a species is encountered in Ueno Park during a given season, as a number from 0 (absent) to 100. One value per species per season; drives both whether a bird appears on the collage and how large it renders.
_Avoid_: commonness, commonness score, likelihood, abundance

**Season**:
One of the four meteorological windows used for Prevalence: Winter (Dec–Feb), Spring (Mar–May), Summer (Jun–Aug), Autumn (Sep–Nov). Not a filter choice by itself — see Season filter.
_Avoid_: time window, period, all-year

**Season filter**:
The collage/atlas filter: a Season or All-year. All-year sizes and includes species by seasonal-max Prevalence. When the visitor has not chosen a filter (or the choice is invalid), the effective filter is the current Season in Asia/Tokyo — not All-year. All-year is only active when explicitly chosen.
_Avoid_: season param, default season, current season tab

**Slug**:
The canonical URL-safe identifier for a species, derived deterministically from the scientific name at create time (lowercase, non-alphanumerics to hyphens). Keys the illustration assets, masks, dims, and atlas routes. The flight-pose variant appends `-2`. Immutable after create — later scientific-name edits do not rewrite it.
_Avoid_: id, key, species code

**Curated field**:
A species field whose value was hand-edited in the admin UI. Re-seeding never overwrites curated fields; all other fields are owned by the seed pipeline.
_Avoid_: manual override, locked field

**Illustration status**:
Where a species' artwork sits in the generation lifecycle: queued, generating, pending review, approved, or failed. Only approved illustrations appear on the collage; the atlas lists every seeded species regardless of status.
_Avoid_: image state, art status

**Anatomy reference**:
A photograph of the actual species (auto-fetched from Wikipedia, admin-overridable) attached to a generation request to anchor identity and markings.
_Avoid_: reference photo, source image

**Style reference**:
An Edo-period kachō-e print (Koson / Yoshida) attached to a generation request so the model borrows its painting technique. Mapped by genus and pose.
_Avoid_: style image, art sample

**Guide species**:
A wild, regularly-occurring bird at Ueno Park / Shinobazu Pond that belongs in the curated list. Escapes, domestics, and one-off vagrants are excluded at review; established ferals with multi-season Prevalence may be kept.
_Avoid_: checklist species, eBird species, recorded species

**Atlas**:
The species catalog — list and detail pages for every Guide species. Complements the collage; not gated by Illustration status.
_Avoid_: gallery, directory, species index

**Listed**:
Whether a Guide species appears on the public collage and atlas. Unlisted species stay in the database (restorable) but are omitted from visitor queries. Soft-hide replaces hard delete. Owner-controlled — re-seed never changes it.
_Avoid_: deleted, archived, active, published

**Locale**:
The visitor's primary language among EN, JA, and ZH-TW. Drives UI chrome and which long-form species fields (description, spotting tips) are shown as primary. Other common names stay visible so the guide remains trilingual in identity; Locale does not hide cross-language names. JA is the default when browser language negotiation does not match EN, JA, or ZH-TW. Empty long-form fields fall back to EN only — never to a third Locale. On species pages the Locale common name is the headline; the other two common names follow as secondary lines (EN first among those when Locale is not EN); scientific name stays last.
_Avoid_: language preference, i18n mode, active language
