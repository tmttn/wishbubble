"use client";

import Link from "next/link";
import Image from "next/image";
import { Gift } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface GuideCardProps {
  slug: string;
  title: string;
  description: string;
  featuredImage: string | null;
  priceMin: number | null;
  priceMax: number | null;
  category: string | null;
}

export function GuideCard({
  slug,
  title,
  description,
  featuredImage,
  priceMin,
  priceMax,
  category,
}: GuideCardProps) {
  const formatPriceRange = () => {
    if (priceMin && priceMax) {
      return `€${priceMin} - €${priceMax}`;
    }
    if (priceMax) {
      return `Under €${priceMax}`;
    }
    return null;
  };

  return (
    <Link href={`/gift-guides/${slug}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
        <div className="relative h-48 bg-muted">
          {featuredImage ? (
            <Image
              src={featuredImage}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/20">
              <Gift className="h-16 w-16 text-primary/40" />
            </div>
          )}
        </div>
        <CardContent className="p-4 space-y-2">
          <h3 className="font-semibold text-lg line-clamp-1">{title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            {category && (
              <Badge variant="secondary" className="text-xs">
                {category}
              </Badge>
            )}
            {formatPriceRange() && (
              <Badge variant="outline" className="text-xs">
                {formatPriceRange()}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
