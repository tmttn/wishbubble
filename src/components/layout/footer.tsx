"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { LanguageToggle } from "./language-toggle";
import { CookiePreferencesLink } from "./cookie-preferences-link";
import { Gift, Heart } from "lucide-react";

export function Footer() {
  const t = useTranslations("footer");

  const links = [
    { href: "/release-notes", label: t("releaseNotes") },
    { href: "/privacy", label: t("privacy") },
    { href: "/terms", label: t("terms") },
    { href: "/cookies", label: t("cookies") },
    { href: "/contact", label: t("contact") },
  ];

  return (
    <footer className="border-t border-border/50 bg-background/80 backdrop-blur-sm">
      <div className="container px-4 sm:px-6 py-8 md:py-10">
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          {/* Logo and copyright */}
          <div className="flex flex-col items-center gap-3 md:items-start">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="rounded-lg bg-gradient-to-br from-primary to-accent p-1.5 shadow-lg shadow-primary/20">
                <Gift className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold font-display bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                WishBubble
              </span>
            </Link>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              {t("madeWith")} <Heart className="h-3.5 w-3.5 text-pink-500 fill-pink-500" /> &copy; {new Date().getFullYear()} {t("copyright")}
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <CookiePreferencesLink />
            <div className="h-4 w-px bg-border hidden md:block" />
            <LanguageToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}
