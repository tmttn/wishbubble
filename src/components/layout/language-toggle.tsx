"use client";

import * as Sentry from "@sentry/nextjs";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { useSession } from "next-auth/react";
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

function useLanguageToggle() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();

  const handleLocaleChange = async (locale: string) => {
    Cookies.set("locale", locale, { expires: 365 });

    // If user is logged in, save locale preference to database
    if (session?.user) {
      try {
        await fetch("/api/user/locale", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locale }),
        });
      } catch (error) {
        Sentry.captureException(error, { tags: { component: "LanguageToggle", action: "saveLocale" } });
      }
    }

    startTransition(() => {
      router.refresh();
    });
  };

  return { handleLocaleChange, isPending };
}

export function LanguageToggle() {
  const t = useTranslations("language");
  const { handleLocaleChange, isPending } = useLanguageToggle();

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

export function LanguageToggleMobile() {
  const t = useTranslations("language");
  const { handleLocaleChange, isPending } = useLanguageToggle();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-3 px-4 py-3 text-base font-medium rounded-xl hover:bg-secondary/50 transition-colors w-full"
          disabled={isPending}
        >
          <Globe className="h-5 w-5 text-muted-foreground" />
          {t("select")}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
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
