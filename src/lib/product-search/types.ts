/**
 * Product Search Types
 *
 * Common interfaces and types for the multi-provider product search system.
 */

/**
 * Common product format returned by all providers
 */
export interface SearchProduct {
  // Identity
  id: string; // Provider-specific ID
  providerId: string; // Provider identifier (bolcom, amazon, awin_coolblue, etc.)

  // Core fields (maps to WishlistItem)
  title: string;
  description?: string;
  price?: number;
  currency: string;
  url: string;
  imageUrl?: string;

  // Extended data
  ean?: string; // European Article Number
  brand?: string;
  category?: string;
  rating?: {
    average: number;
    count: number;
  };
  originalPrice?: number; // For sale items
  availability?: "in_stock" | "out_of_stock" | "unknown";

  // Provider metadata
  affiliateUrl?: string; // Pre-generated affiliate link
  providerMetadata?: Record<string, unknown>;
}

/**
 * Search options for product queries
 */
export interface SearchOptions {
  query: string;
  page?: number;
  pageSize?: number;
  sort?: "relevance" | "price_asc" | "price_desc" | "rating";
  priceMin?: number;
  priceMax?: number;
  category?: string;
}

/**
 * Search result from a single provider
 */
export interface SearchResult {
  products: SearchProduct[];
  totalResults: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  provider: string;
}

/**
 * Aggregated search result from multiple providers
 */
export interface AggregatedSearchResult {
  products: SearchProduct[];
  totalResults: number;
  page: number;
  pageSize: number;
  providers: ProviderSearchSummary[];
}

/**
 * Summary of a provider's contribution to aggregated results
 */
export interface ProviderSearchSummary {
  id: string;
  name: string;
  resultCount: number;
  error?: string;
}

/**
 * Provider status
 */
export type ProviderStatus =
  | "available"
  | "unavailable"
  | "error"
  | "disabled";

/**
 * Provider information for display
 */
export interface ProviderInfo {
  id: string;
  name: string;
  type: "realtime" | "feed" | "scraper";
  status: ProviderStatus;
  lastUpdated?: Date; // For feed providers
  productCount?: number; // For feed providers
  supportsEanLookup: boolean;
  supportedCountries?: string[];
}

/**
 * Transform a SearchProduct to the format expected by WishlistItem
 */
export interface WishlistItemInput {
  title: string;
  description?: string;
  price?: number;
  currency: string;
  url: string;
  imageUrl?: string;
}

/**
 * Convert a SearchProduct to WishlistItemInput
 */
export function toWishlistItem(product: SearchProduct): WishlistItemInput {
  return {
    title: product.title,
    description: product.description,
    price: product.price,
    currency: product.currency,
    url: product.affiliateUrl || product.url,
    imageUrl: product.imageUrl,
  };
}
