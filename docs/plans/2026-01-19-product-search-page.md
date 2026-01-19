# Product Search Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a dedicated `/search` page for browsing and searching products with filters, categories, and quick-add to wishlist functionality.

**Architecture:** Client-side search page using existing `/api/products/search` endpoint. URL query params for shareable search state. TanStack Query for data fetching. Bottom sheets for mobile filter/add flows.

**Tech Stack:** Next.js App Router, TanStack Query, Tailwind CSS, shadcn/ui, next-intl

---

## Task 1: Add Translations

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/nl.json`

**Step 1: Add English translations**

Add to `messages/en.json` inside the root object (find a logical place, perhaps after "wishlist"):

```json
"search": {
  "title": "Find Products",
  "placeholder": "Search for products...",
  "noResults": "No products found",
  "noResultsHint": "Try a different search term or browse categories",
  "loading": "Searching...",
  "error": "Failed to search products",
  "results": "{count} products found",
  "filters": {
    "title": "Filters",
    "price": "Price",
    "priceRange": "Price range",
    "minPrice": "Min price",
    "maxPrice": "Max price",
    "apply": "Apply filters",
    "clear": "Clear filters"
  },
  "sort": {
    "title": "Sort by",
    "relevance": "Relevance",
    "priceAsc": "Price: Low to High",
    "priceDesc": "Price: High to Low",
    "rating": "Rating"
  },
  "view": {
    "grid": "Grid view",
    "list": "List view"
  },
  "categories": {
    "all": "All",
    "electronics": "Electronics",
    "fashion": "Fashion & Clothing",
    "home": "Home & Living",
    "toys": "Toys & Games",
    "books": "Books & Media",
    "beauty": "Beauty & Personal Care",
    "sports": "Sports & Outdoors",
    "kitchen": "Kitchen & Dining"
  },
  "addToWishlist": {
    "button": "Add to Wishlist",
    "selectWishlist": "Select wishlist",
    "success": "Added to {wishlist}",
    "noWishlists": "Create a wishlist first",
    "createWishlist": "Create wishlist"
  },
  "product": {
    "inStock": "In stock",
    "outOfStock": "Out of stock",
    "rating": "{rating} out of 5"
  },
  "browseLink": "Need more options? Browse all products"
}
```

**Step 2: Add Dutch translations**

Add to `messages/nl.json` (same structure):

```json
"search": {
  "title": "Producten Zoeken",
  "placeholder": "Zoek naar producten...",
  "noResults": "Geen producten gevonden",
  "noResultsHint": "Probeer een andere zoekterm of bekijk categorieën",
  "loading": "Zoeken...",
  "error": "Zoeken mislukt",
  "results": "{count} producten gevonden",
  "filters": {
    "title": "Filters",
    "price": "Prijs",
    "priceRange": "Prijsbereik",
    "minPrice": "Min. prijs",
    "maxPrice": "Max. prijs",
    "apply": "Filters toepassen",
    "clear": "Filters wissen"
  },
  "sort": {
    "title": "Sorteren op",
    "relevance": "Relevantie",
    "priceAsc": "Prijs: Laag naar Hoog",
    "priceDesc": "Prijs: Hoog naar Laag",
    "rating": "Beoordeling"
  },
  "view": {
    "grid": "Rasterweergave",
    "list": "Lijstweergave"
  },
  "categories": {
    "all": "Alles",
    "electronics": "Elektronica",
    "fashion": "Mode & Kleding",
    "home": "Wonen & Leven",
    "toys": "Speelgoed & Spellen",
    "books": "Boeken & Media",
    "beauty": "Beauty & Verzorging",
    "sports": "Sport & Outdoor",
    "kitchen": "Keuken & Eten"
  },
  "addToWishlist": {
    "button": "Toevoegen aan Verlanglijst",
    "selectWishlist": "Selecteer verlanglijst",
    "success": "Toegevoegd aan {wishlist}",
    "noWishlists": "Maak eerst een verlanglijst",
    "createWishlist": "Verlanglijst aanmaken"
  },
  "product": {
    "inStock": "Op voorraad",
    "outOfStock": "Niet op voorraad",
    "rating": "{rating} van 5"
  },
  "browseLink": "Meer opties nodig? Bekijk alle producten"
}
```

**Step 3: Regenerate i18n types**

Run: `npm run generate:i18n-types`
Expected: Types regenerated successfully

**Step 4: Commit**

```bash
git add messages/en.json messages/nl.json src/i18n/types.generated.ts
git commit -m "feat(i18n): add product search page translations"
```

---

## Task 2: Create Search Page Shell

**Files:**
- Create: `src/app/(main)/search/page.tsx`

**Step 1: Create the page file**

```tsx
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SearchPageClient } from "@/components/search/search-page-client";
import { Loader2 } from "lucide-react";

export async function generateMetadata() {
  const t = await getTranslations("search");
  return {
    title: t("title"),
  };
}

function SearchLoading() {
  return (
    <div className="min-h-screen bg-gradient-mesh flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export default async function SearchPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <Suspense fallback={<SearchLoading />}>
      <SearchPageClient />
    </Suspense>
  );
}
```

**Step 2: Create placeholder client component**

Create `src/components/search/search-page-client.tsx`:

```tsx
"use client";

import { useTypedTranslations } from "@/i18n/useTypedTranslations";

export function SearchPageClient() {
  const t = useTypedTranslations("search");

  return (
    <div className="min-h-screen bg-gradient-mesh">
      <div className="container px-4 sm:px-6 py-6 md:py-10">
        <h1 className="text-2xl sm:text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground mt-2">Search page placeholder</p>
      </div>
    </div>
  );
}
```

**Step 3: Verify page loads**

Run: `npm run dev` (in another terminal)
Navigate to: `http://localhost:3000/search`
Expected: Page loads with "Find Products" title

**Step 4: Commit**

```bash
git add src/app/\(main\)/search/page.tsx src/components/search/search-page-client.tsx
git commit -m "feat(search): add search page shell"
```

---

## Task 3: Create Category Chips Component

**Files:**
- Create: `src/components/search/search-categories.tsx`

**Step 1: Create categories component**

```tsx
"use client";

import { useTypedTranslations } from "@/i18n/useTypedTranslations";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export const CATEGORIES = [
  "all",
  "electronics",
  "fashion",
  "home",
  "toys",
  "books",
  "beauty",
  "sports",
  "kitchen",
] as const;

export type Category = (typeof CATEGORIES)[number];

interface SearchCategoriesProps {
  selected: Category;
  onSelect: (category: Category) => void;
}

export function SearchCategories({ selected, onSelect }: SearchCategoriesProps) {
  const t = useTypedTranslations("search.categories");

  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-2 pb-2">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => onSelect(category)}
            className={cn(
              "inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition-colors",
              "min-h-[44px] shrink-0",
              selected === category
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            )}
          >
            {t(category)}
          </button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" className="invisible" />
    </ScrollArea>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/search/search-categories.tsx
git commit -m "feat(search): add category chips component"
```

---

## Task 4: Create Filter Components

**Files:**
- Create: `src/components/search/search-filters.tsx`

**Step 1: Create filters component**

```tsx
"use client";

import { useState } from "react";
import { useTypedTranslations } from "@/i18n/useTypedTranslations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Filter, Grid, List, SlidersHorizontal } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";

export type SortOption = "relevance" | "price_asc" | "price_desc" | "rating";
export type ViewMode = "grid" | "list";

interface FilterState {
  minPrice?: number;
  maxPrice?: number;
}

interface SearchFiltersProps {
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export function SearchFilters({
  sort,
  onSortChange,
  viewMode,
  onViewModeChange,
  filters,
  onFiltersChange,
}: SearchFiltersProps) {
  const t = useTypedTranslations("search");
  const tSort = useTypedTranslations("search.sort");
  const tFilters = useTypedTranslations("search.filters");
  const tView = useTypedTranslations("search.view");
  const isMobile = useMediaQuery("(max-width: 640px)");

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  const applyFilters = () => {
    onFiltersChange(localFilters);
    setIsFilterOpen(false);
  };

  const clearFilters = () => {
    const cleared = { minPrice: undefined, maxPrice: undefined };
    setLocalFilters(cleared);
    onFiltersChange(cleared);
    setIsFilterOpen(false);
  };

  const FilterContent = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{tFilters("priceRange")}</Label>
        <div className="flex gap-2 items-center">
          <Input
            type="number"
            placeholder={tFilters("minPrice")}
            value={localFilters.minPrice || ""}
            onChange={(e) =>
              setLocalFilters((prev) => ({
                ...prev,
                minPrice: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
            className="w-full"
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="number"
            placeholder={tFilters("maxPrice")}
            value={localFilters.maxPrice || ""}
            onChange={(e) =>
              setLocalFilters((prev) => ({
                ...prev,
                maxPrice: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
            className="w-full"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex items-center gap-2">
      {/* Filter Button - Mobile: Bottom Sheet, Desktop: Popover */}
      {isMobile ? (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFilterOpen(true)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            {tFilters("title")}
          </Button>
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetContent side="bottom" showDragHandle>
              <SheetHeader>
                <SheetTitle>{tFilters("title")}</SheetTitle>
              </SheetHeader>
              <div className="py-4">
                <FilterContent />
              </div>
              <SheetFooter className="flex-row gap-2">
                <Button variant="outline" onClick={clearFilters} className="flex-1">
                  {tFilters("clear")}
                </Button>
                <Button onClick={applyFilters} className="flex-1">
                  {tFilters("apply")}
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </>
      ) : (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              {tFilters("title")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <FilterContent />
            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={clearFilters} className="flex-1">
                {tFilters("clear")}
              </Button>
              <Button onClick={applyFilters} className="flex-1">
                {tFilters("apply")}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Sort Dropdown */}
      <Select value={sort} onValueChange={(v) => onSortChange(v as SortOption)}>
        <SelectTrigger className="w-[140px] sm:w-[180px]">
          <SelectValue placeholder={tSort("title")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="relevance">{tSort("relevance")}</SelectItem>
          <SelectItem value="price_asc">{tSort("priceAsc")}</SelectItem>
          <SelectItem value="price_desc">{tSort("priceDesc")}</SelectItem>
          <SelectItem value="rating">{tSort("rating")}</SelectItem>
        </SelectContent>
      </Select>

      {/* View Toggle */}
      <div className="flex border rounded-lg">
        <Button
          variant={viewMode === "grid" ? "secondary" : "ghost"}
          size="icon"
          onClick={() => onViewModeChange("grid")}
          className="rounded-r-none"
          aria-label={tView("grid")}
        >
          <Grid className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === "list" ? "secondary" : "ghost"}
          size="icon"
          onClick={() => onViewModeChange("list")}
          className="rounded-l-none"
          aria-label={tView("list")}
        >
          <List className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
```

**Step 2: Create useMediaQuery hook if it doesn't exist**

Check if it exists: `ls src/hooks/use-media-query.ts`

If not, create `src/hooks/use-media-query.ts`:

```tsx
"use client";

import { useState, useEffect } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
}
```

**Step 3: Commit**

```bash
git add src/components/search/search-filters.tsx src/hooks/use-media-query.ts
git commit -m "feat(search): add filter and sort components"
```

---

## Task 5: Create Product Card Component

**Files:**
- Create: `src/components/search/search-product-card.tsx`

**Step 1: Create product card component**

```tsx
"use client";

import Image from "next/image";
import { useTypedTranslations } from "@/i18n/useTypedTranslations";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, ShoppingBag, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const t = useTypedTranslations("search");
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
```

**Step 2: Commit**

```bash
git add src/components/search/search-product-card.tsx
git commit -m "feat(search): add product card component"
```

---

## Task 6: Create Add to Wishlist Popover

**Files:**
- Create: `src/components/search/add-to-wishlist-popover.tsx`

**Step 1: Create the component**

```tsx
"use client";

import { useState, useEffect } from "react";
import { useTypedTranslations } from "@/i18n/useTypedTranslations";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Loader2, Check, Plus } from "lucide-react";
import { toast } from "sonner";
import { useMediaQuery } from "@/hooks/use-media-query";
import Link from "next/link";
import type { SearchProductData } from "./search-product-card";

interface Wishlist {
  id: string;
  name: string;
  isDefault: boolean;
}

interface AddToWishlistPopoverProps {
  product: SearchProductData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anchorRef?: React.RefObject<HTMLElement>;
}

export function AddToWishlistPopover({
  product,
  open,
  onOpenChange,
}: AddToWishlistPopoverProps) {
  const t = useTypedTranslations("search.addToWishlist");
  const tToasts = useTypedTranslations("toasts");
  const isMobile = useMediaQuery("(max-width: 640px)");

  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState<string | null>(null);

  // Fetch wishlists when opened
  useEffect(() => {
    if (open && wishlists.length === 0) {
      setIsLoading(true);
      fetch("/api/wishlists")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setWishlists(data);
          }
        })
        .catch(() => {
          toast.error(tToasts("error.generic"));
        })
        .finally(() => setIsLoading(false));
    }
  }, [open, wishlists.length, tToasts]);

  const handleAddToWishlist = async (wishlistId: string, wishlistName: string) => {
    if (!product) return;

    setIsAdding(wishlistId);
    try {
      const response = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wishlistId,
          title: product.title,
          description: product.description || "",
          price: product.price,
          currency: product.currency || "EUR",
          url: product.url,
          imageUrl: product.imageUrl || "",
          priority: "NICE_TO_HAVE",
          quantity: 1,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add item");
      }

      toast.success(t("success", { wishlist: wishlistName }));
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : tToasts("error.generic")
      );
    } finally {
      setIsAdding(null);
    }
  };

  const Content = () => (
    <div className="space-y-2">
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : wishlists.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground mb-3">{t("noWishlists")}</p>
          <Button asChild size="sm">
            <Link href="/wishlist">
              <Plus className="h-4 w-4 mr-2" />
              {t("createWishlist")}
            </Link>
          </Button>
        </div>
      ) : (
        wishlists.map((wishlist) => (
          <button
            key={wishlist.id}
            onClick={() => handleAddToWishlist(wishlist.id, wishlist.name)}
            disabled={isAdding !== null}
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors text-left disabled:opacity-50"
          >
            <span className="font-medium">{wishlist.name}</span>
            {isAdding === wishlist.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        ))
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" showDragHandle>
          <SheetHeader>
            <SheetTitle>{t("selectWishlist")}</SheetTitle>
          </SheetHeader>
          <div className="py-4">
            <Content />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <span /> {/* Hidden trigger - we control open state externally */}
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2">
        <p className="text-sm font-medium mb-2 px-2">{t("selectWishlist")}</p>
        <Content />
      </PopoverContent>
    </Popover>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/search/add-to-wishlist-popover.tsx
git commit -m "feat(search): add wishlist picker popover"
```

---

## Task 7: Create Product Grid Component

**Files:**
- Create: `src/components/search/product-grid.tsx`

**Step 1: Create product grid component**

```tsx
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
```

**Step 2: Commit**

```bash
git add src/components/search/product-grid.tsx
git commit -m "feat(search): add product grid component"
```

---

## Task 8: Implement Full Search Page Client

**Files:**
- Modify: `src/components/search/search-page-client.tsx`

**Step 1: Replace with full implementation**

```tsx
"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTypedTranslations } from "@/i18n/useTypedTranslations";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SearchCategories, type Category } from "./search-categories";
import { SearchFilters, type SortOption, type ViewMode } from "./search-filters";
import { ProductGrid } from "./product-grid";
import { AddToWishlistPopover } from "./add-to-wishlist-popover";
import type { SearchProductData } from "./search-product-card";

interface SearchState {
  query: string;
  category: Category;
  sort: SortOption;
  minPrice?: number;
  maxPrice?: number;
}

export function SearchPageClient() {
  const t = useTypedTranslations("search");
  const tCommon = useTypedTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from URL params
  const [searchState, setSearchState] = useState<SearchState>(() => ({
    query: searchParams.get("q") || "",
    category: (searchParams.get("category") as Category) || "all",
    sort: (searchParams.get("sort") as SortOption) || "relevance",
    minPrice: searchParams.get("minPrice")
      ? Number(searchParams.get("minPrice"))
      : undefined,
    maxPrice: searchParams.get("maxPrice")
      ? Number(searchParams.get("maxPrice"))
      : undefined,
  }));

  const [inputValue, setInputValue] = useState(searchState.query);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [products, setProducts] = useState<SearchProductData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  // Add to wishlist state
  const [selectedProduct, setSelectedProduct] = useState<SearchProductData | null>(null);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  // Update URL when search state changes
  const updateUrl = useCallback((state: SearchState) => {
    const params = new URLSearchParams();
    if (state.query) params.set("q", state.query);
    if (state.category !== "all") params.set("category", state.category);
    if (state.sort !== "relevance") params.set("sort", state.sort);
    if (state.minPrice) params.set("minPrice", String(state.minPrice));
    if (state.maxPrice) params.set("maxPrice", String(state.maxPrice));

    const newUrl = params.toString() ? `/search?${params}` : "/search";
    router.replace(newUrl, { scroll: false });
  }, [router]);

  // Search function
  const performSearch = useCallback(async (state: SearchState) => {
    // Need either a query or a category (not "all") to search
    if (!state.query && state.category === "all") {
      setProducts([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const params = new URLSearchParams();

      // Build search query - combine text query with category
      let searchQuery = state.query;
      if (state.category !== "all") {
        // Add category as part of the query for now
        // TODO: Add proper category filtering to API
        searchQuery = state.query
          ? `${state.query} ${state.category}`
          : state.category;
      }

      params.set("q", searchQuery);
      params.set("sort", state.sort);
      if (state.minPrice) params.set("priceMin", String(state.minPrice));
      if (state.maxPrice) params.set("priceMax", String(state.maxPrice));

      const response = await fetch(`/api/products/search?${params}`);

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();
      setProducts(data.products || []);
      setTotalResults(data.totalResults || 0);
    } catch (error) {
      toast.error(t("error"));
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  // Search on initial load if URL has params
  useEffect(() => {
    if (searchState.query || searchState.category !== "all") {
      performSearch(searchState);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const newState = { ...searchState, query: inputValue };
    setSearchState(newState);
    updateUrl(newState);
    performSearch(newState);
  };

  // Handle category change
  const handleCategoryChange = (category: Category) => {
    const newState = { ...searchState, category };
    setSearchState(newState);
    updateUrl(newState);
    performSearch(newState);
  };

  // Handle sort change
  const handleSortChange = (sort: SortOption) => {
    const newState = { ...searchState, sort };
    setSearchState(newState);
    updateUrl(newState);
    performSearch(newState);
  };

  // Handle filter change
  const handleFiltersChange = (filters: { minPrice?: number; maxPrice?: number }) => {
    const newState = { ...searchState, ...filters };
    setSearchState(newState);
    updateUrl(newState);
    performSearch(newState);
  };

  // Handle add to wishlist
  const handleAddToWishlist = (product: SearchProductData) => {
    setSelectedProduct(product);
    setIsWishlistOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-mesh">
      <div className="container px-4 sm:px-6 py-6 md:py-10">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">{t("title")}</h1>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t("placeholder")}
              className="pl-10 pr-24 h-12 text-base rounded-xl"
            />
            <Button
              type="submit"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                tCommon("search")
              )}
            </Button>
          </div>
        </form>

        {/* Categories */}
        <div className="mb-4">
          <SearchCategories
            selected={searchState.category}
            onSelect={handleCategoryChange}
          />
        </div>

        {/* Filters Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-muted-foreground">
            {hasSearched && !isLoading && (
              <span>{t("results", { count: totalResults })}</span>
            )}
          </div>
          <SearchFilters
            sort={searchState.sort}
            onSortChange={handleSortChange}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            filters={{
              minPrice: searchState.minPrice,
              maxPrice: searchState.maxPrice,
            }}
            onFiltersChange={handleFiltersChange}
          />
        </div>

        {/* Results */}
        <ProductGrid
          products={products}
          viewMode={viewMode}
          isLoading={isLoading}
          onAddToWishlist={handleAddToWishlist}
          hasSearched={hasSearched}
        />

        {/* Add to Wishlist Popover/Sheet */}
        <AddToWishlistPopover
          product={selectedProduct}
          open={isWishlistOpen}
          onOpenChange={setIsWishlistOpen}
        />
      </div>
    </div>
  );
}
```

**Step 2: Verify the page works**

Navigate to: `http://localhost:3000/search`
Test: Enter a search term, select categories, change filters
Expected: Products load, filters work, add to wishlist shows popover

**Step 3: Commit**

```bash
git add src/components/search/search-page-client.tsx
git commit -m "feat(search): implement full search page functionality"
```

---

## Task 9: Add Navigation Entry Points

**Files:**
- Modify: Navigation component (find the main nav file)
- Modify: `src/components/wishlist/add-item-form.tsx`

**Step 1: Find and modify navigation**

Search for the main navigation component and add a "Browse" link pointing to `/search`.

**Step 2: Add link in add-item-form**

In `src/components/wishlist/add-item-form.tsx`, add a link after the search input section (around line 464, after the search results div):

```tsx
{/* Link to full search page */}
{isSearchAvailable && (
  <Link
    href="/search"
    className="text-sm text-primary hover:underline flex items-center gap-1 mt-2"
  >
    {t("browseLink") || "Need more options? Browse all products"}
    <ArrowRight className="h-3 w-3" />
  </Link>
)}
```

Add imports at top:
```tsx
import Link from "next/link";
import { ArrowRight } from "lucide-react";
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat(search): add navigation entry points"
```

---

## Task 10: Run Tests and Build

**Step 1: Run tests**

```bash
npm run test:run
```

Expected: All tests pass

**Step 2: Run build**

```bash
npm run build
```

Expected: Build succeeds without errors

**Step 3: Fix any issues**

If tests or build fail, fix the issues before proceeding.

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: fix any remaining issues"
```

---

## Task 11: Create Pull Request

**Step 1: Push branch**

```bash
git push -u origin feature/product-search-page
```

**Step 2: Create PR**

```bash
gh pr create --title "feat: add product search page" --body "$(cat <<'EOF'
## Summary
- Adds dedicated `/search` page for browsing and searching products
- Includes category chips, price filters, sort options, grid/list toggle
- Quick-add to wishlist flow with wishlist picker
- Fully responsive with mobile-optimized bottom sheets
- Translations for EN and NL

## Test plan
- [ ] Navigate to /search and verify page loads
- [ ] Search for products and verify results appear
- [ ] Test category filtering
- [ ] Test price range filters
- [ ] Test sort options
- [ ] Test grid/list view toggle
- [ ] Test add to wishlist flow
- [ ] Verify mobile responsiveness
- [ ] Verify link from add-item dialog works

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Summary

This plan creates a complete product search page with:
- 8 predefined categories with horizontal scrolling chips
- Price range filtering and sort options
- Grid and list view toggle
- Quick add-to-wishlist flow with wishlist picker
- Mobile-optimized with bottom sheets
- URL-based state for shareable searches
- Full i18n support (EN + NL)
