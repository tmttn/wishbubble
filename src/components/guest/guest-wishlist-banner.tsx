"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Gift, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGuestWishlist } from "@/lib/guest-wishlist";

export function GuestWishlistBanner() {
  const t = useTranslations("guest.banner");
  const { hasWishlist, itemCount } = useGuestWishlist();
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted || !hasWishlist || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-primary text-primary-foreground py-3 px-4 z-50">
      <div className="container flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Gift className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">
            {t("message", { count: itemCount })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" asChild>
            <Link href="/register">{t("cta")}</Link>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-primary-foreground hover:text-primary-foreground/80"
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
