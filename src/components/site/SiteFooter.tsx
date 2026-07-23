import Link from "next/link";
import { SITE_FOOTER } from "@/lib/site/attribution";

export function SiteFooter() {
  return (
    <footer className="mt-auto px-6 py-6 md:px-10">
      <div className="mx-auto max-w-3xl text-center">
        <p className="font-mono text-[10px] tracking-[0.18em] text-ink-soft uppercase">
          {SITE_FOOTER.credit}{" "}
          <a
            href={SITE_FOOTER.creditUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-hairline underline-offset-4 transition-colors hover:text-ink"
          >
            github
          </a>
          {" · "}
          <a
            href={SITE_FOOTER.creditSiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-hairline underline-offset-4 transition-colors hover:text-ink"
          >
            {SITE_FOOTER.creditSite}
          </a>
          {" · "}
          <Link
            href="/about"
            className="underline decoration-hairline underline-offset-4 transition-colors hover:text-ink"
          >
            About について
          </Link>
        </p>
      </div>
    </footer>
  );
}
