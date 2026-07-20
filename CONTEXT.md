# Birds in Ueno

A curated, trilingual (EN / JA / ZH-TW) bird guide for Ueno Park, Tokyo. A collage view sizes bird illustrations by how often each species is encountered, filtered by season. Visually forked from AvianVisitors, reimplemented on Next.js + Convex.

## Language

**Prevalence**:
How frequently a species is encountered in Ueno Park during a given season, as a number from 0 (absent) to 100. One value per species per season; drives both whether a bird appears on the collage and how large it renders.
_Avoid_: commonness, commonness score, likelihood, abundance

**Season**:
One of the four collage filter windows, on meteorological boundaries: Winter (Dec–Feb), Spring (Mar–May), Summer (Jun–Aug), Autumn (Sep–Nov). The unit of granularity for Prevalence.
_Avoid_: time window, period

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
