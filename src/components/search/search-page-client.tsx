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
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="text-sm text-muted-foreground whitespace-nowrap">
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
