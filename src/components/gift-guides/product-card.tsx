"use client";

import Image from "next/image";
import { ExternalLink, ShoppingCart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  title: string;
  description: string | null;
  price: number | null;
  currency: string;
  imageUrl: string | null;
  url: string;
  affiliateUrl: string | null;
  brand: string | null;
  category: string | null;
}

export function ProductCard({
  title,
  description,
  price,
  currency,
  imageUrl,
  url,
  affiliateUrl,
  brand,
  category,
}: ProductCardProps) {
  const formatPrice = (price: number | null, currency: string) => {
    if (!price) return null;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(price);
  };

  const productUrl = affiliateUrl || url;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
      <div className="relative aspect-square bg-muted">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-contain p-4"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground/40" />
          </div>
        )}
      </div>
      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="flex-1 space-y-2">
          {brand && (
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              {brand}
            </p>
          )}
          <h3 className="font-medium line-clamp-2">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {description}
            </p>
          )}
        </div>
        <div className="mt-4 space-y-3">
          {price && (
            <p className="text-lg font-semibold text-primary">
              {formatPrice(price, currency)}
            </p>
          )}
          <Button variant="outline" size="sm" className="w-full" asChild>
            <a href={productUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Product
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
