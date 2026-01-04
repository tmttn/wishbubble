"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Trash2, ExternalLink, Star, Heart, Sparkles, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GuestWishlistItem as GuestWishlistItemType } from "@/lib/guest-wishlist/types";

interface GuestWishlistItemProps {
  item: GuestWishlistItemType;
  onRemove: (id: string) => void;
}

export function GuestWishlistItem({ item, onRemove }: GuestWishlistItemProps) {
  const t = useTranslations("guest.wishlist");

  const formatPrice = (price: number | undefined, currency: string) => {
    if (!price) return null;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(price);
  };

  const getPriorityBadge = () => {
    switch (item.priority) {
      case "MUST_HAVE":
        return (
          <Badge variant="destructive" className="gap-1">
            <Star className="h-3 w-3" />
            {t("priority.mustHave")}
          </Badge>
        );
      case "DREAM":
        return (
          <Badge variant="secondary" className="gap-1 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
            <Sparkles className="h-3 w-3" />
            {t("priority.dream")}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            <Heart className="h-3 w-3" />
            {t("priority.niceToHave")}
          </Badge>
        );
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex">
          {/* Image */}
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 bg-muted">
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.title}
                fill
                className="object-cover"
                sizes="128px"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                <Gift className="h-8 w-8" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-3 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium line-clamp-1">{item.title}</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => onRemove(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {item.description && (
                <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                  {item.description}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {item.price && (
                <span className="font-semibold text-primary">
                  {formatPrice(item.price, item.currency)}
                </span>
              )}
              {getPriorityBadge()}
              {item.url && (
                <Button variant="ghost" size="sm" className="h-6 px-2" asChild>
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
