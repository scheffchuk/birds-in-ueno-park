"use client";

import type { ComponentProps, ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { hrefWithSeason } from "@/lib/collage/season";
import { useSeasonQuery } from "@/lib/collage/use-season-filter";

type SeasonPath = "/" | "/atlas";

type SeasonLinkProps = {
  pathname: SeasonPath;
  children: ReactNode;
  className?: string;
} & Omit<ComponentProps<typeof Link>, "href">;

/** next-intl Link that carries `?season=` when present in the current URL. */
export function SeasonLink({
  pathname,
  children,
  className,
  ...rest
}: SeasonLinkProps) {
  const season = useSeasonQuery();
  return (
    <Link href={hrefWithSeason(pathname, season)} className={className} {...rest}>
      {children}
    </Link>
  );
}
