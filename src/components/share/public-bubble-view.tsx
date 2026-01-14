"use client";

import { useTypedTranslations } from "@/i18n/useTypedTranslations";
import Link from "next/link";
import { Calendar, Users, Gift, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
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

interface Wishlist {
  id: string;
  name: string;
  description: string | null;
  ownerName: string | null;
  items: WishlistItem[];
}

interface PublicBubbleViewProps {
  bubble: {
    id: string;
    name: string;
    description: string | null;
    occasionType: string;
    eventDate: string | null;
    memberCount: number;
    themeColor: string | null;
    coverImageUrl: string | null;
  };
  ownerName: string | null;
  wishlists: Wishlist[];
  totalItems: number;
  shareCode: string;
}

export function PublicBubbleView({
  bubble,
  ownerName,
  wishlists,
  totalItems,
  shareCode,
}: PublicBubbleViewProps) {
  const t = useTypedTranslations("share");
  const tOccasions = useTypedTranslations("bubbles.occasions");

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date(dateStr));
  };

  const getOccasionLabel = (type: string) => {
    try {
      // Type is uppercase enum value like "CHRISTMAS", "BIRTHDAY", etc.
      return tOccasions(type as "CHRISTMAS" | "BIRTHDAY" | "SINTERKLAAS" | "WEDDING" | "BABY_SHOWER" | "GRADUATION" | "HOUSEWARMING" | "OTHER");
    } catch {
      return type;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div
        className="relative py-12 px-4"
        style={{
          backgroundColor: bubble.themeColor
            ? `${bubble.themeColor}20`
            : undefined,
        }}
      >
        {bubble.coverImageUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-10"
            style={{ backgroundImage: `url(${bubble.coverImageUrl})` }}
          />
        )}
        <div className="relative max-w-4xl mx-auto text-center space-y-4">
          <div className="flex justify-center">
            <Gift className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">{bubble.name}</h1>
          {bubble.description && (
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {bubble.description}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <Badge variant="secondary" className="text-sm">
              {getOccasionLabel(bubble.occasionType)}
            </Badge>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{t("memberCount", { count: bubble.memberCount })}</span>
            </div>
            {bubble.eventDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(bubble.eventDate)}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Gift className="h-4 w-4" />
              <span>{t("itemCount", { count: totalItems })}</span>
            </div>
          </div>
          {ownerName && (
            <p className="text-sm text-muted-foreground">
              {t("createdBy", { name: ownerName })}
            </p>
          )}
        </div>
      </div>

      {/* Wishlists */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {wishlists.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t("noItems")}</h3>
              <p className="text-muted-foreground">{t("noItemsDescription")}</p>
            </CardContent>
          </Card>
        ) : (
          wishlists.map((wishlist) => (
            <div key={wishlist.id} className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">{wishlist.name}</h2>
                {wishlist.ownerName && (
                  <span className="text-sm text-muted-foreground">
                    {t("by", { name: wishlist.ownerName })}
                  </span>
                )}
              </div>
              {wishlist.description && (
                <p className="text-muted-foreground">{wishlist.description}</p>
              )}
              <div className="grid gap-4">
                {wishlist.items.map((item) => (
                  <PublicWishlistItem key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Join CTA */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t py-4 px-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h3 className="font-semibold">{t("joinCta.title")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("joinCta.description")}
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href={`/register?callbackUrl=/join/${shareCode}`}>
                <UserPlus className="h-4 w-4 mr-2" />
                {t("joinCta.register")}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/login?callbackUrl=/join/${shareCode}`}>
                {t("joinCta.login")}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
