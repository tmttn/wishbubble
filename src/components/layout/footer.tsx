"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { LanguageToggle } from "./language-toggle";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t py-6">
      <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} WishBubble. {t("copyright")}
        </p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <Link href="/privacy" className="hover:underline">
            {t("privacy")}
          </Link>
          <Link href="/terms" className="hover:underline">
            {t("terms")}
          </Link>
          <Link href="/cookies" className="hover:underline">
            {t("cookies")}
          </Link>
          <LanguageToggle />
        </div>
      </div>
    </footer>
  );
}
