import { ArrowLeftIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type BackLinkProps = {
  href: "/" | "/atlas";
  label: string;
  className?: string;
};

/** Plain back control. Use `@/components/season/SeasonLink` with `backLabel` when `?season=` should carry. */
export function BackLink({ href, label, className }: BackLinkProps) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        buttonVariants({ variant: "ghost", size: "icon" }),
        "text-ink-soft hover:text-ink",
        className,
      )}
    >
      <ArrowLeftIcon />
    </Link>
  );
}
