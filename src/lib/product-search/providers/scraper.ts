/**
 * URL Scraper Product Search Provider
 *
 * Wraps the existing URL scraper to implement the ProductSearchProvider interface.
 * This provider doesn't support search, but can fetch product details from any URL.
 */

import { ProductSearchProvider } from "./base";
import {
  SearchOptions,
  SearchResult,
  SearchProduct,
  ProviderInfo,
  ProviderStatus,
} from "../types";
import { scrapeUrl, ScrapedProductData } from "@/lib/url-scraper";

export class ScraperProvider extends ProductSearchProvider {
  readonly id = "scraper";
  readonly name = "URL Scraper";
  readonly type = "scraper" as const;

  isConfigured(): boolean {
    // Scraper is always available
    return true;
  }

  async getStatus(): Promise<ProviderStatus> {
    return "available";
  }

  async getInfo(): Promise<ProviderInfo> {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      status: "available",
      supportsEanLookup: false,
    };
  }

  /**
   * Scraper doesn't support search - returns empty results
   */
  async search(_options: SearchOptions): Promise<SearchResult> {
    // Scraper provider doesn't support search
    return {
      products: [],
      totalResults: 0,
      page: 1,
      pageSize: 0,
      hasMore: false,
      provider: this.id,
    };
  }

  /**
   * Scrape a URL and return product data
   */
  async scrapeProductUrl(url: string): Promise<SearchProduct | null> {
    const data = await scrapeUrl(url);
    if (!data || !data.title) {
      return null;
    }

    return this.transformScrapedData(url, data);
  }

  generateAffiliateLink(productUrl: string, _subId?: string): string {
    // Scraper doesn't generate affiliate links
    return productUrl;
  }

  matchesUrl(_url: string): boolean {
    // Scraper matches any URL as a fallback
    return true;
  }

  /**
   * Transform scraped data to SearchProduct format
   */
  private transformScrapedData(
    url: string,
    data: ScrapedProductData
  ): SearchProduct {
    return {
      id: this.generateIdFromUrl(url),
      providerId: this.id,
      title: data.title || "Unknown Product",
      description: data.description,
      price: data.price,
      currency: data.currency || "EUR",
      url,
      imageUrl: data.imageUrl,
      availability: "unknown",
    };
  }

  /**
   * Generate a unique ID from a URL
   */
  private generateIdFromUrl(url: string): string {
    // Simple hash-like ID from URL
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `scrape_${Math.abs(hash).toString(36)}`;
  }
}
