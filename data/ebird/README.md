# eBird histogram inputs

Hotspots:

- `L920322` — Taito Ward--Ueno Park
- `L920941` — Taito Ward--Ueno Park--Shinobazu Pond

## Source note

Exact "Download Histogram Data" TSVs require an eBird login. The committed
`.tsv` files were reconstructed from the public bar-chart pages (bin midpoints
per eBird’s published frequency bins) so the seed pipeline can run offline.
Replace with logged-in downloads when available — same filename, same format.

`exotic-flags.json` comes from Exotic badges on those bar charts (Escapee vs
Naturalized), used by Guide-species trim.

## Refresh

1. Optional: replace TSVs with exact downloads from each hotspot’s Bar Charts →
   Download Histogram Data.
2. `pnpm seed:histogram` — merges max/week → meteorological Seasons → review CSV
   + fixtures + Convex upsert (when `NEXT_PUBLIC_CONVEX_URL` is set).
