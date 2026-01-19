"use client";

import { useTypedTranslations } from "@/i18n/useTypedTranslations";
import { SearchProductCard, type SearchProductData } from "./search-product-card";
import { Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductGridProps {
  products: SearchProductData[];
  viewMode: "grid" | "list";
  isLoading: boolean;
  onAddToWishlist: (product: SearchProductData) => void;
  hasSearched: boolean;
}

export function ProductGrid({
  products,
  viewMode,
  isLoading,
  onAddToWishlist,
  hasSearched,
}: ProductGridProps) {
  const t = useTypedTranslations("search");

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">{t("loading")}</p>
      </div>
    );
  }

  if (!hasSearched) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground text-center">
          {t("placeholder")}
        </p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="font-medium mb-1">{t("noResults")}</p>
        <p className="text-muted-foreground text-sm text-center">
          {t("noResultsHint")}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        viewMode === "grid"
          ? "grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
          : "space-y-3"
      )}
    >
      {products.map((product) => (
        <SearchProductCard
          key={`${product.providerId}-${product.id}`}
          product={product}
          viewMode={viewMode}
          onAddToWishlist={onAddToWishlist}
        />
      ))}
    </div>
  );
}
