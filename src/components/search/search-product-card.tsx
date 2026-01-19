"use client";

import Image from "next/image";
import { useTypedTranslations } from "@/i18n/useTypedTranslations";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, ShoppingBag, Plus } from "lucide-react";

export interface SearchProductData {
  id: string;
  providerId: string;
  title: string;
  description?: string;
  price?: number;
  currency: string;
  url: string;
  imageUrl?: string;
  ean?: string;
  brand?: string;
  rating?: { average: number; count: number };
  originalPrice?: number;
  availability?: "in_stock" | "out_of_stock" | "unknown";
}

interface SearchProductCardProps {
  product: SearchProductData;
  viewMode: "grid" | "list";
  onAddToWishlist: (product: SearchProductData) => void;
}

export function SearchProductCard({
  product,
  viewMode,
  onAddToWishlist,
}: SearchProductCardProps) {
  const tProduct = useTypedTranslations("search.product");
  const tAdd = useTypedTranslations("search.addToWishlist");

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency,
    }).format(price);
  };

  if (viewMode === "list") {
    return (
      <Card className="border-0 bg-card/80 backdrop-blur-sm card-hover">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Image */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.title}
                  fill
                  className="object-contain"
                  sizes="96px"
                />
              ) : (
                <ShoppingBag className="h-8 w-8 text-muted-foreground" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium line-clamp-2 text-sm sm:text-base">
                {product.title}
              </h3>
              {product.brand && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {product.brand}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                {product.price !== undefined && (
                  <span className="font-semibold text-primary">
                    {formatPrice(product.price, product.currency)}
                  </span>
                )}
                {product.rating && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    {product.rating.average.toFixed(1)}
                  </span>
                )}
              </div>
            </div>

            {/* Add Button */}
            <Button
              size="sm"
              onClick={() => onAddToWishlist(product)}
              className="shrink-0 self-center"
            >
              <Plus className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">{tAdd("button")}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grid view
  return (
    <Card className="border-0 bg-card/80 backdrop-blur-sm card-hover h-full flex flex-col">
      <CardContent className="p-4 flex flex-col h-full">
        {/* Image */}
        <div className="relative aspect-square rounded-lg bg-muted flex items-center justify-center overflow-hidden mb-3">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.title}
              fill
              className="object-contain"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <ShoppingBag className="h-12 w-12 text-muted-foreground" />
          )}
          {product.availability === "out_of_stock" && (
            <Badge
              variant="secondary"
              className="absolute top-2 right-2 bg-background/80"
            >
              {tProduct("outOfStock")}
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          <h3 className="font-medium line-clamp-2 text-sm">{product.title}</h3>
          {product.brand && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {product.brand}
            </p>
          )}

          <div className="flex items-center gap-2 mt-2">
            {product.rating && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                {product.rating.average.toFixed(1)}
                {product.rating.count > 0 && (
                  <span>({product.rating.count})</span>
                )}
              </span>
            )}
          </div>

          <div className="mt-auto pt-3">
            {product.price !== undefined && (
              <div className="flex items-baseline gap-2 mb-2">
                <span className="font-semibold text-lg text-primary">
                  {formatPrice(product.price, product.currency)}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-sm text-muted-foreground line-through">
                    {formatPrice(product.originalPrice, product.currency)}
                  </span>
                )}
              </div>
            )}

            <Button
              onClick={() => onAddToWishlist(product)}
              className="w-full"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              {tAdd("button")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
