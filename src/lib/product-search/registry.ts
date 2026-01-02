/**
 * Product Search Provider Registry
 *
 * Manages registration and lookup of product search providers.
 * Supports aggregated search across multiple providers.
 */

import { ProductSearchProvider } from "./providers/base";
import {
  AggregatedSearchResult,
  SearchOptions,
  ProviderInfo,
  SearchProduct,
  ProviderSearchSummary,
} from "./types";
import { logger } from "@/lib/logger";

class ProviderRegistry {
  private providers = new Map<string, ProductSearchProvider>();

  /**
   * Register a provider
   */
  register(provider: ProductSearchProvider): void {
    this.providers.set(provider.id, provider);
    logger.debug(`Registered product search provider: ${provider.id}`);
  }

  /**
   * Get a specific provider by ID
   */
  get(id: string): ProductSearchProvider | undefined {
    return this.providers.get(id);
  }

  /**
   * Get all registered providers
   */
  getAll(): ProductSearchProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get all enabled/configured providers
   */
  async getEnabled(): Promise<ProductSearchProvider[]> {
    const providers = this.getAll();
    const enabled: ProductSearchProvider[] = [];

    for (const provider of providers) {
      if (provider.isConfigured()) {
        const status = await provider.getStatus();
        if (status === "available") {
          enabled.push(provider);
        }
      }
    }

    return enabled;
  }

  /**
   * Get info for all providers
   */
  async getAllInfo(): Promise<ProviderInfo[]> {
    const providers = this.getAll();
    return Promise.all(providers.map((p) => p.getInfo()));
  }

  /**
   * Search across all enabled providers (aggregated results)
   */
  async searchAll(options: SearchOptions): Promise<AggregatedSearchResult> {
    const enabledProviders = await this.getEnabled();

    if (enabledProviders.length === 0) {
      return {
        products: [],
        totalResults: 0,
        page: options.page || 1,
        pageSize: options.pageSize || 20,
        providers: [],
      };
    }

    const searchPromises = enabledProviders.map(async (provider) => {
      try {
        const result = await provider.search(options);
        return {
          provider: provider.id,
          name: provider.name,
          result,
          error: undefined,
        };
      } catch (error) {
        logger.error(`Provider ${provider.id} search failed`, error);
        return {
          provider: provider.id,
          name: provider.name,
          result: null,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    });

    const results = await Promise.allSettled(searchPromises);

    // Aggregate results
    const allProducts: SearchProduct[] = [];
    const providerSummaries: ProviderSearchSummary[] = [];
    let totalResults = 0;

    for (const result of results) {
      if (result.status === "fulfilled") {
        const { provider, name, result: searchResult, error } = result.value;

        if (searchResult) {
          allProducts.push(...searchResult.products);
          totalResults += searchResult.totalResults;
          providerSummaries.push({
            id: provider,
            name,
            resultCount: searchResult.products.length,
          });
        } else {
          providerSummaries.push({
            id: provider,
            name,
            resultCount: 0,
            error,
          });
        }
      }
    }

    // Interleave results from different providers for balanced exposure
    const sortedProducts = this.interleaveResults(
      allProducts,
      providerSummaries.map((p) => p.id)
    );

    const pageSize = options.pageSize || 20;
    const page = options.page || 1;

    return {
      products: sortedProducts.slice(0, pageSize),
      totalResults,
      page,
      pageSize,
      providers: providerSummaries,
    };
  }

  /**
   * Search a specific provider
   */
  async searchProvider(
    providerId: string,
    options: SearchOptions
  ): Promise<AggregatedSearchResult> {
    const provider = this.get(providerId);

    if (!provider) {
      return {
        products: [],
        totalResults: 0,
        page: options.page || 1,
        pageSize: options.pageSize || 20,
        providers: [
          { id: providerId, name: providerId, resultCount: 0, error: "Provider not found" },
        ],
      };
    }

    if (!provider.isConfigured()) {
      return {
        products: [],
        totalResults: 0,
        page: options.page || 1,
        pageSize: options.pageSize || 20,
        providers: [
          { id: providerId, name: provider.name, resultCount: 0, error: "Provider not configured" },
        ],
      };
    }

    try {
      const result = await provider.search(options);
      return {
        products: result.products,
        totalResults: result.totalResults,
        page: result.page,
        pageSize: result.pageSize,
        providers: [
          { id: provider.id, name: provider.name, resultCount: result.products.length },
        ],
      };
    } catch (error) {
      logger.error(`Provider ${providerId} search failed`, error);
      return {
        products: [],
        totalResults: 0,
        page: options.page || 1,
        pageSize: options.pageSize || 20,
        providers: [
          {
            id: providerId,
            name: provider.name,
            resultCount: 0,
            error: error instanceof Error ? error.message : "Search failed",
          },
        ],
      };
    }
  }

  /**
   * Find provider that matches a URL
   */
  findProviderForUrl(url: string): ProductSearchProvider | undefined {
    for (const provider of this.providers.values()) {
      if (provider.matchesUrl(url)) {
        return provider;
      }
    }
    return undefined;
  }

  /**
   * Lookup product by EAN across all providers that support it
   */
  async lookupByEan(ean: string): Promise<SearchProduct | null> {
    const enabledProviders = await this.getEnabled();

    for (const provider of enabledProviders) {
      try {
        const product = await provider.getByEan(ean);
        if (product) {
          return product;
        }
      } catch (error) {
        logger.warn(`Provider ${provider.id} EAN lookup failed`, { ean, error });
      }
    }

    return null;
  }

  /**
   * Interleave results from different providers
   * This ensures balanced exposure across providers
   */
  private interleaveResults(
    products: SearchProduct[],
    providerOrder: string[]
  ): SearchProduct[] {
    const byProvider = new Map<string, SearchProduct[]>();

    for (const product of products) {
      const existing = byProvider.get(product.providerId) || [];
      existing.push(product);
      byProvider.set(product.providerId, existing);
    }

    const result: SearchProduct[] = [];
    let hasMore = true;
    let index = 0;

    while (hasMore) {
      hasMore = false;
      for (const providerId of providerOrder) {
        const providerProducts = byProvider.get(providerId);
        if (providerProducts && providerProducts[index]) {
          result.push(providerProducts[index]);
          hasMore = true;
        }
      }
      index++;
    }

    return result;
  }
}

// Singleton instance
export const providerRegistry = new ProviderRegistry();
