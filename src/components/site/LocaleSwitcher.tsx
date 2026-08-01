"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

type LocaleSwitcherProps = {
  className?: string;
};

function isAppLocale(value: string): value is AppLocale {
  return (routing.locales as readonly string[]).includes(value);
}

export function LocaleSwitcher({ className }: LocaleSwitcherProps) {
  const t = useTranslations("LocaleSwitcher");
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();

  return (
    <ToggleGroup
      value={[locale]}
      onValueChange={(next) => {
        const selected = next[0];
        if (selected && isAppLocale(selected) && selected !== locale) {
          router.replace(pathname, { locale: selected });
        }
      }}
      variant="default"
      size="sm"
      spacing={0}
      aria-label={t("label")}
      className={cn(
        "rounded-full bg-paper-2 p-0.5 shadow-[var(--recess)]",
        className,
      )}
    >
      {routing.locales.map((code) => (
        <ToggleGroupItem
          key={code}
          value={code}
          aria-label={t(code)}
          className={cn(
            "h-auto min-h-0 rounded-full border-0 px-2.5 py-1.5 font-mono text-[10px] leading-none tracking-[0.12em] text-ink-soft uppercase shadow-none",
            "inline-flex items-center justify-center hover:bg-transparent hover:text-ink",
            "data-[state=on]:bg-background data-[state=on]:text-ink data-[state=on]:shadow-[var(--raised)]",
          )}
        >
          {t(code)}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
