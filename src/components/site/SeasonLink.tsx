"use client";

import type { ComponentProps, ReactNode } from "react";
import { ArrowLeftIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { hrefWithSeason } from "@/lib/collage/season";
import { useSeasonQuery } from "@/lib/collage/season-context";
import { cn } from "@/lib/utils";

type SeasonPath = "/" | "/atlas";

type SeasonLinkProps = {
  pathname: SeasonPath;
  className?: string;
} & (
  | { backLabel: string; children?: never }
  | { backLabel?: undefined; children: ReactNode }
) &
  Omit<ComponentProps<typeof Link>, "href" | "children" | "aria-label">;

/** next-intl Link that carries `?season=` when present in the current URL. */
export function SeasonLink({
  pathname,
  children,
  className,
  backLabel,
  ...rest
}: SeasonLinkProps) {
  const season = useSeasonQuery();
  const href = hrefWithSeason(pathname, season);

  if (backLabel) {
    return (
      <Link
        href={href}
        aria-label={backLabel}
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "text-ink-soft hover:text-ink",
          className,
        )}
        {...rest}
      >
        <ArrowLeftIcon />
      </Link>
    );
  }

  return (
    <Link href={href} className={className} {...rest}>
      {children}
    </Link>
  );
}
