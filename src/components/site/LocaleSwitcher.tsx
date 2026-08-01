"use client";

import { useRef } from "react";
import { ChevronDownIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const mountedAtRef = useRef(performance.now());

  return (
    <DropdownMenu
      onOpenChange={(open, eventDetails) => {
        if (open && performance.now() - mountedAtRef.current < 400) {
          eventDetails.cancel();
        }
      }}
    >
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 rounded-full border-0 bg-paper-2 px-3 font-mono text-[10px] leading-none tracking-[0.12em] text-ink-soft uppercase shadow-(--recess)",
              "gap-1 has-data-[icon=inline-end]:pr-3",
              "hover:bg-paper-2 hover:text-ink aria-expanded:bg-paper-2 aria-expanded:text-ink",
              className,
            )}
          />
        }
        aria-label={t("label")}
      >
        {t(locale)}
        <ChevronDownIcon data-icon="inline-end" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto min-w-36">
        <DropdownMenuGroup>
          <DropdownMenuRadioGroup
            value={locale}
            onValueChange={(next) => {
              if (isAppLocale(next) && next !== locale) {
                router.replace(pathname, { locale: next });
              }
            }}
          >
            {routing.locales.map((code) => (
              <DropdownMenuRadioItem
                key={code}
                value={code}
                className="font-mono text-[10px] tracking-[0.12em] uppercase"
              >
                {t(code)}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
