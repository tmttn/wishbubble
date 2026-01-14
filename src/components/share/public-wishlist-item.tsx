"use client";

import Image from "next/image";
import { ExternalLink, Star, Heart, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTypedTranslations } from "@/i18n/useTypedTranslations";

interface PublicWishlistItemProps {
  item: {
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
  };
}

export function PublicWishlistItem({ item }: PublicWishlistItemProps) {
  const t = useTypedTranslations("share");

  const imageUrl = item.uploadedImage || item.imageUrl;

  const formatPrice = (price: number | null, priceMax: number | null, currency: string) => {
    if (!price) return null;
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    });
    if (priceMax && priceMax !== price) {
      return `${formatter.format(price)} - ${formatter.format(priceMax)}`;
    }
    return formatter.format(price);
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
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          {/* Image */}
          <div className="relative h-48 sm:h-auto sm:w-48 flex-shrink-0 bg-muted">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={item.title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 192px"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                <Gift className="h-12 w-12" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-lg leading-tight">{item.title}</h3>
              {getPriorityBadge()}
            </div>

            {item.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {item.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {item.price && (
                <span className="font-semibold text-lg text-primary">
                  {formatPrice(item.price, item.priceMax, item.currency)}
                </span>
              )}
              {item.quantity > 1 && (
                <Badge variant="outline">
                  {t("quantity", { count: item.quantity })}
                </Badge>
              )}
              {item.category && (
                <Badge variant="secondary">{item.category}</Badge>
              )}
            </div>

            {item.url && (
              <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                <a href={item.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {t("viewProduct")}
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Gift icon component for placeholder
function Gift({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13" />
      <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
    </svg>
  );
}
