import Link from "next/link";
import { ABOUT_SECTIONS, SITE_FOOTER } from "@/lib/site/attribution";
import { SiteFooter } from "@/components/site/SiteFooter";

export default function AboutPage() {
  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <article className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-12 px-6 py-12 md:px-8">
        <header className="flex flex-col gap-4 text-center">
          <Link
            href="/"
            className="self-center font-mono text-[10px] tracking-[0.18em] text-ink-soft uppercase transition-colors hover:text-ink"
          >
            ← Collage コラージュ
          </Link>
          <p className="font-heading text-sm tracking-wide text-ink-2 italic">
            Ueno Park · Shinobazu Pond
          </p>
          <h1 className="font-heading text-3xl tracking-tight text-ink md:text-5xl">
            About について
          </h1>
        </header>

        {ABOUT_SECTIONS.map((section) => (
          <section key={section.id} className="flex flex-col gap-4">
            <h2 className="font-heading text-xl tracking-wide text-ink">
              {section.titleEn}
              <span className="mt-1 block text-base font-normal text-ink-2">
                {section.titleJa}
              </span>
            </h2>
            <p className="text-base leading-relaxed text-ink-2">
              {section.bodyEn}
            </p>
            <p className="text-base leading-relaxed text-ink-2">
              {section.bodyJa}
            </p>
          </section>
        ))}

        <p className="border-t border-hairline pt-8 text-center font-mono text-[10px] tracking-[0.18em] text-ink-soft uppercase">
          <a
            href={SITE_FOOTER.creditUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-hairline underline-offset-4 hover:text-ink"
          >
            {SITE_FOOTER.credit}
          </a>
          {" · "}
          <a
            href={SITE_FOOTER.creditSiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-hairline underline-offset-4 hover:text-ink"
          >
            {SITE_FOOTER.creditSite}
          </a>
        </p>
      </article>
      <SiteFooter />
    </main>
  );
}
