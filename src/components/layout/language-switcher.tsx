"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { setLocaleAction } from "@/app/actions/locale";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";
import type { Locale } from "@/i18n/request";

export function LanguageSwitcher({
  variant = "ghost",
}: {
  variant?: "ghost" | "outline";
}) {
  const currentLocale = useLocale() as Locale;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSelect = (locale: Locale) => {
    if (locale === currentLocale) return;
    startTransition(async () => {
      await setLocaleAction(locale);
      router.refresh();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant={variant}
            size="sm"
            className="gap-1 h-8 px-1.5 sm:px-2.5 text-xs font-medium"
            disabled={isPending}
          >
            <Globe className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden xs:inline sm:inline">
              {currentLocale === "my" ? "မြန်မာ" : "English"}
            </span>
            <span className="xs:hidden uppercase font-bold text-[10px]">
              {currentLocale}
            </span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-32">
        <DropdownMenuItem
          onClick={() => handleSelect("my")}
          className={currentLocale === "my" ? "bg-accent font-semibold" : ""}
        >
          🇲🇲 မြန်မာ
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleSelect("en")}
          className={currentLocale === "en" ? "bg-accent font-semibold" : ""}
        >
          🇬🇧 English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
