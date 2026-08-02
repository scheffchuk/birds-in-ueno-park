"use client";

import { useRef } from "react";
import { LanguagesIcon } from "lucide-react";
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
            size="icon"
            className={cn(
              "size-8 rounded-lg border-0 bg-paper-2 text-ink-soft shadow-(--recess)",
              "hover:bg-paper-2 hover:text-ink aria-expanded:bg-paper-2 aria-expanded:text-ink",
              className,
            )}
          />
        }
        aria-label={t("label")}
      >
        <LanguagesIcon />
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
