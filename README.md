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

## Admin (`/admin`)

Convex Auth + GitHub OAuth, gated by `ADMIN_GITHUB_IDS` (comma-separated GitHub user ids).

On the Convex deployment:

1. `SITE_URL` — e.g. `http://localhost:3000`
2. `JWT_PRIVATE_KEY` + `JWKS` — from Convex Auth setup (`npx @convex-dev/auth` or manual)
3. `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` — [GitHub OAuth App](https://github.com/settings/developers); callback `https://<deployment>.convex.site/api/auth/callback/github`
4. `ADMIN_GITHUB_IDS` — your numeric GitHub user id(s)
