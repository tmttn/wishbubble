"use client";

import { useTranslations } from "next-intl";
import { useTransition } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const locales = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱" },
] as const;

export function LanguageToggle() {
  const t = useTranslations("language");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLocaleChange = (locale: string) => {
    Cookies.set("locale", locale, { expires: 365 });
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 px-0"
          disabled={isPending}
        >
          <Globe className="h-4 w-4" />
          <span className="sr-only">{t("select")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale.code}
            onClick={() => handleLocaleChange(locale.code)}
          >
            <span className="mr-2">{locale.flag}</span>
            {locale.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
