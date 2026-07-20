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
