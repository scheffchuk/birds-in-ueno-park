# Next Cache Components on 16.3 preview; atlas cached, collage live

Adopt Next.js **16.3.0-preview.9** with `cacheComponents` and `partialPrefetching` enabled together (Workflow wrapper preserved). Public atlas detail uses `'use cache'` (`cacheLife('hours')`, tags `guide-species` / `species:{slug}`); the collage keeps Convex `preloadQuery` outside that cache (request-time via `connection()` + Suspense) so live subscriptions are not fighting a stale RSC snapshot. Season-filtered atlas list streams (request-time `searchParams` inside Suspense); `/admin` opts out with `export const instant = false`.

Root layout wraps `ConvexAuthNextjsServerProvider` in Suspense so cookie auth does not block Partial Prerender shells. Illustration API routes drop `export const runtime = "nodejs"` (incompatible with Cache Components; Node remains the default). Generate / reject-and-regenerate bust `species:{slug}` via injectable `revalidateTags` → `revalidateTag(tag, "max")` on success only.

Invalidation is TTL-first: tag busts only from those illustration Next API routes. Curated edits, Listed toggles, and approve stay Convex-direct from admin — no write-path proxy and no Convex→Next revalidate webhook for v1.

Considered and rejected: staying on 16.2 stable (misses 16.3 partial prefetch / shell work we want), caching collage `preloadQuery`, proxying all public-affecting admin writes through Next solely for `revalidateTag`, and a Convex webhook for cache busts.
