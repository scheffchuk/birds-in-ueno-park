/**
 * Local/dev poll of open illustration Batchwork jobs (Hobby Vercel has no
 * minute crons). Requires `pnpm dev` and CRON_SECRET or ILLUSTRATION_PIPELINE_SECRET.
 *
 *   pnpm cron:illustration-batches
 *   watch -n 60 pnpm cron:illustration-batches   # every minute
 */
const secret =
  process.env.CRON_SECRET ?? process.env.ILLUSTRATION_PIPELINE_SECRET;
const base = (
  process.env.SITE_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  "http://localhost:3000"
).replace(/\/$/, "");

if (!secret) {
  console.error("CRON_SECRET or ILLUSTRATION_PIPELINE_SECRET required");
  process.exit(1);
}

const res = await fetch(`${base}/api/cron/illustration-batches`, {
  headers: { Authorization: `Bearer ${secret}` },
});
const text = await res.text();
if (!res.ok) {
  console.error(res.status, text);
  process.exit(1);
}
console.log(text);
