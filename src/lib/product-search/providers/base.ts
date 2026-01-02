/**
 * Base Product Search Provider
 *
 * Abstract class that defines the interface all product search providers must implement.
 */

import {
  SearchOptions,
  SearchResult,
  SearchProduct,
  ProviderInfo,
  ProviderStatus,
} from "../types";

export abstract class ProductSearchProvider {
  /**
   * Unique identifier for this provider (e.g., "bolcom", "awin_coolblue")
   */
  abstract readonly id: string;

  /**
   * Display name for this provider (e.g., "Bol.com", "Coolblue")
   */
  abstract readonly name: string;

  /**
   * Provider type: realtime (API), feed (database), or scraper
   */
  abstract readonly type: "realtime" | "feed" | "scraper";

  /**
   * Check if provider is properly configured and available
   */
  abstract isConfigured(): boolean;

  /**
   * Get current provider status
   */
  abstract getStatus(): Promise<ProviderStatus>;

  /**
   * Get provider info including configuration status
   */
  abstract getInfo(): Promise<ProviderInfo>;

  /**
   * Search for products
   */
  abstract search(options: SearchOptions): Promise<SearchResult>;

  /**
   * Look up product by EAN (optional - not all providers support this)
   */
  async getByEan(_ean: string): Promise<SearchProduct | null> {
    return null;
  }

  /**
   * Generate affiliate link for a product URL
   */
  abstract generateAffiliateLink(productUrl: string, subId?: string): string;

  /**
   * Check if a URL belongs to this provider's domain
   */
  abstract matchesUrl(url: string): boolean;
}
