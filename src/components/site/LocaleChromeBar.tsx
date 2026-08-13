import { Suspense, type ReactNode } from "react";
import { LocaleSwitcher } from "@/components/site/LocaleSwitcher";
import { cn } from "@/lib/utils";

function LeadingFallback() {
  return <div className="size-8 shrink-0" aria-hidden />;
}

function TrailingFallback() {
  return (
    <div
      className="size-8 shrink-0 rounded-lg bg-paper-2 shadow-(--recess)"
      aria-hidden
    />
  );
}

/** Layout-stable placeholder matching LocaleChromeBar’s usual height. */
export function LocaleChromeBarFallback({
  className,
  showLeading = true,
}: {
  className?: string;
  showLeading?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3",
        showLeading ? "justify-between" : "justify-end",
        className,
      )}
      aria-hidden
    >
      {showLeading ? <LeadingFallback /> : null}
      <TrailingFallback />
    </div>
  );
}

/**
 * Public Locale toolbar: optional leading control + trailing (LocaleSwitcher by default).
 * Suspense wraps both slots so SeasonLink / useSearchParams never block the shell.
 */
export function LocaleChromeBar({
  leading,
  trailing,
  className,
}: {
  leading?: ReactNode;
  /** Defaults to LocaleSwitcher. */
  trailing?: ReactNode;
  className?: string;
}) {
  const end = trailing ?? <LocaleSwitcher />;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3",
        leading ? "justify-between" : "justify-end",
        className,
      )}
    >
      {leading ? (
        <Suspense fallback={<LeadingFallback />}>{leading}</Suspense>
      ) : null}
      <Suspense fallback={<TrailingFallback />}>{end}</Suspense>
    </div>
  );
}
