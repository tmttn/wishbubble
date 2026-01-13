"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { Gift, UserPlus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PublicWishlistItem } from "./public-wishlist-item";

interface WishlistItem {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  priceMax: number | null;
  currency: string;
  url: string | null;
  imageUrl: string | null;
  uploadedImage: string | null;
  priority: "MUST_HAVE" | "NICE_TO_HAVE" | "DREAM";
  quantity: number;
  category: string | null;
}

interface PublicWishlistViewProps {
  wishlist: {
    id: string;
    name: string;
    description: string | null;
  };
  owner: {
    name: string | null;
    avatarUrl: string | null;
  };
  items: WishlistItem[];
  totalItems: number;
  shareCode: string;
}

export function PublicWishlistView({
  wishlist,
  owner,
  items,
  totalItems,
  shareCode: _shareCode,
}: PublicWishlistViewProps) {
  const t = useTranslations("share");
  const _locale = useLocale();

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="relative py-12 px-4 bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="relative max-w-4xl mx-auto text-center space-y-4">
          <div className="flex justify-center">
            <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
              <AvatarImage src={owner.avatarUrl || undefined} alt={owner.name || "User"} />
              <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-accent text-white">
                {getInitials(owner.name)}
              </AvatarFallback>
            </Avatar>
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">{wishlist.name}</h1>
            {owner.name && (
              <p className="text-muted-foreground mt-2 flex items-center justify-center gap-2">
                <User className="h-4 w-4" />
                {t("wishlistBy", { name: owner.name })}
              </p>
            )}
          </div>
          {wishlist.description && (
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {wishlist.description}
            </p>
          )}
          <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
            <Gift className="h-4 w-4" />
            <span>{t("itemCount", { count: totalItems })}</span>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        {items.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t("noItems")}</h3>
              <p className="text-muted-foreground">{t("noItemsDescription")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {items.map((item) => (
              <PublicWishlistItem key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* Join CTA */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t py-4 px-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h3 className="font-semibold">{t("wishlistCta.title")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("wishlistCta.description")}
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/register">
                <UserPlus className="h-4 w-4 mr-2" />
                {t("wishlistCta.register")}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/login">
                {t("wishlistCta.login")}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
