# Birds in Ueno

Curated bird guide for Ueno Park / Shinobazu Pond. Collage sized by seasonal **Prevalence**.

## Getting Started

```bash
pnpm install
pnpm exec convex dev   # keep running; links .env.local
pnpm seed:histogram    # eBird TSVs → Guide species + Convex
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
pnpm test
pnpm typecheck
```

Histogram inputs: [`data/ebird/`](data/ebird/). Domain language: [`CONTEXT.md`](CONTEXT.md). Plan: [`PLAN.md`](PLAN.md).

## Species copy (xAI via AI Gateway)

Offline script writes EN / JA / ZH-TW descriptions + spotting tips. Requires `AI_GATEWAY_API_KEY` in `.env.local` (Grok through Vercel AI Gateway; no Gemini).

**Spot-check (~5 species) before a full batch:**

```bash
pnpm seed:copy -- --limit 5 --dry-run   # preview selection
pnpm seed:copy -- --limit 5             # generate + Convex upsert
# review Atlas detail pages, then:
pnpm seed:copy                          # full Guide species list
```

Options: `--limit N`, `--slug <slug>`, `--dry-run`. Re-runs skip fields in `curatedFields` (admin hand-edits). Output also lands in `data/species-copy.json`.

## Admin (`/admin`)

Convex Auth + GitHub OAuth, gated by `ADMIN_GITHUB_IDS` (comma-separated GitHub user ids).

On the Convex deployment:

1. `SITE_URL` — e.g. `http://localhost:3000` (also used for public style-ref URLs)
2. `JWT_PRIVATE_KEY` + `JWKS` — from Convex Auth setup (`npx @convex-dev/auth` or manual)
3. `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` — [GitHub OAuth App](https://github.com/settings/developers); callback `https://<deployment>.convex.site/api/auth/callback/github`
4. `ADMIN_GITHUB_IDS` — your numeric GitHub user id(s)
5. `ILLUSTRATION_PIPELINE_SECRET` — shared secret for Workflow → Convex staging
6. `CONVEX_SITE_URL` — e.g. `https://<deployment>.convex.site` (anatomy refs at `/refs/anatomy/:slug`)

On Vercel / `.env.local` (Next):

1. `NEXT_PUBLIC_CONVEX_URL`
2. `XAI_API_KEY` — vision verify (`grok-4-fast`)
3. `FAL_KEY` — BiRefNet matting (cream-key fallback if exhausted)
4. `AI_GATEWAY_API_KEY` — species copy + **illustration generate** (`google/gemini-2.5-flash-image`)
5. `ILLUSTRATION_PIPELINE_SECRET` — same as Convex
6. `SITE_URL` / `NEXT_PUBLIC_SITE_URL` — public base for `/refs/style/{perch,flight}.jpg`

### Illustration pipeline (#8)

1. Seed anatomy for a slice: Admin → **Seed anatomy (N)** (Wikipedia → Convex; served at `CONVEX_SITE_URL/refs/anatomy/:slug`)
2. Style placeholders live in `public/refs/style/` (replace with Koson/Yoshida prints when ready)
3. **Generate missing (20)** runs sync Gemini Flash Image (`google/gemini-2.5-flash-image` via AI Gateway), uploads PNG, starts per-pose Workflows (mat → verify → stage)
4. Review queue: approve pair, or **Regen perch / flight / both** (re-triggers generation; works for pending review and approved)
5. Incomplete leftovers: Admin → defer incomplete (or leave queued) for later **manual attach** (#7)

### About + polish (#9)

- `/about` — Prevalence methodology, eBird source, illustration + AvianVisitors credits (EN + JA)
- Site footer on collage, atlas, and about
- Visitor chrome: paper theme, recessed season pill, collage hover tip
