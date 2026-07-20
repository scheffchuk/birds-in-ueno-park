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

## Species copy (xAI)

Offline script writes EN / JA / ZH-TW descriptions + spotting tips. Requires `XAI_API_KEY` in `.env.local` (no Gemini).

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

1. `SITE_URL` — e.g. `http://localhost:3000`
2. `JWT_PRIVATE_KEY` + `JWKS` — from Convex Auth setup (`npx @convex-dev/auth` or manual)
3. `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` — [GitHub OAuth App](https://github.com/settings/developers); callback `https://<deployment>.convex.site/api/auth/callback/github`
4. `ADMIN_GITHUB_IDS` — your numeric GitHub user id(s)
