/**
 * Typesense Product Search Provider
 *
 * Uses Typesense Cloud for fast, typo-tolerant product search with relevance ranking.
 */

import {
  SearchOptions,
  SearchResult,
  SearchProduct,
  ProviderInfo,
  ProviderStatus,
} from "../types";
import { ProductSearchProvider } from "./base";
import {
  getTypesenseClient,
  isTypesenseEnabled,
  PRODUCTS_COLLECTION_NAME,
  TypesenseProduct,
  expandQuery,
} from "@/lib/typesense";

export class TypesenseProvider extends ProductSearchProvider {
  readonly id = "typesense";
  readonly name = "Typesense Search";
  readonly type = "feed" as const;

  isConfigured(): boolean {
    return isTypesenseEnabled();
  }

  async getStatus(): Promise<ProviderStatus> {
    if (!this.isConfigured()) {
      return "unavailable";
    }

    try {
      const client = getTypesenseClient();
      await client.health.retrieve();
      return "available";
    } catch {
      return "error";
    }
  }

  async getInfo(): Promise<ProviderInfo> {
    const status = await this.getStatus();
    let productCount: number | undefined;

    if (status === "available") {
      try {
        const client = getTypesenseClient();
        const collection = await client
          .collections(PRODUCTS_COLLECTION_NAME)
          .retrieve();
        productCount = collection.num_documents;
      } catch {
        // Collection might not exist yet
      }
    }

    return {
      id: this.id,
      name: this.name,
      type: this.type,
      status,
      productCount,
      supportsEanLookup: true,
    };
  }

  async search(options: SearchOptions): Promise<SearchResult> {
    if (!this.isConfigured()) {
      return this.emptyResult(options);
    }

    const client = getTypesenseClient();
    const page = options.page || 1;
    const pageSize = Math.min(options.pageSize || 12, 50);

    // Build filter string
    const filters: string[] = [];
    if (options.priceMin !== undefined) {
      filters.push(`price:>=${options.priceMin}`);
    }
    if (options.priceMax !== undefined) {
      filters.push(`price:<=${options.priceMax}`);
    }
    if (options.category) {
      filters.push(`category:=${options.category}`);
    }

    // Build sort string
    let sortBy = "_text_match:desc,providerPriority:desc";
    if (options.sort === "price_asc") {
      sortBy = "price:asc,_text_match:desc";
    } else if (options.sort === "price_desc") {
      sortBy = "price:desc,_text_match:desc";
    }
    // "relevance" and "rating" both use text match + priority

    try {
      // Expand query to include brand names for better relevance
      // e.g., "iPhone" → "Apple iPhone"
      const expandedQuery = expandQuery(options.query);

      const searchResult = await client
        .collections(PRODUCTS_COLLECTION_NAME)
        .documents()
        .search({
          q: expandedQuery,
          query_by: "title,brand,description",
          query_by_weights: "3,2,1",
          filter_by: filters.length > 0 ? filters.join(" && ") : undefined,
          sort_by: sortBy,
          per_page: pageSize,
          page,
          facet_by: "category,brand",
          max_facet_values: 20,
          num_typos: 2,
          prefix: true,
        });

      const products: SearchProduct[] = (searchResult.hits || []).map((hit) => {
        const doc = hit.document as unknown as TypesenseProduct;
        return this.mapToSearchProduct(doc);
      });

      return {
        products,
        totalResults: searchResult.found,
        page,
        pageSize,
        hasMore: page * pageSize < searchResult.found,
        provider: this.id,
      };
    } catch (error) {
      console.error("Typesense search error:", error);
      return this.emptyResult(options);
    }
  }

  async getByEan(ean: string): Promise<SearchProduct | null> {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const client = getTypesenseClient();
      const searchResult = await client
        .collections(PRODUCTS_COLLECTION_NAME)
        .documents()
        .search({
          q: "*",
          query_by: "title",
          filter_by: `ean:=${ean}`,
          per_page: 1,
        });

      if (searchResult.hits && searchResult.hits.length > 0) {
        const doc = searchResult.hits[0].document as TypesenseProduct;
        return this.mapToSearchProduct(doc);
      }

      return null;
    } catch {
      return null;
    }
  }

  generateAffiliateLink(productUrl: string, _subId?: string): string {
    // Typesense returns products from multiple providers
    // The affiliate link should already be set in the document
    return productUrl;
  }

  matchesUrl(_url: string): boolean {
    // Typesense is a search index, not a specific retailer
    // Individual products might match different providers
    return false;
  }

  private mapToSearchProduct(doc: TypesenseProduct): SearchProduct {
    return {
      id: doc.id,
      // Use "typesense" as providerId for search result grouping/interleaving
      // The original feed provider info is preserved in providerMetadata
      providerId: this.id,
      title: doc.title,
      description: doc.description,
      price: doc.price,
      currency: doc.currency || "EUR",
      url: doc.url,
      imageUrl: doc.imageUrl,
      ean: doc.ean,
      brand: doc.brand,
      category: doc.category,
      availability: this.mapAvailability(doc.availability),
      affiliateUrl: doc.affiliateUrl,
      providerMetadata: {
        providerName: doc.providerName,
        providerPriority: doc.providerPriority,
        originalProviderId: doc.providerId,
      },
    };
  }

  private mapAvailability(
    availability?: string
  ): "in_stock" | "out_of_stock" | "unknown" {
    switch (availability) {
      case "IN_STOCK":
        return "in_stock";
      case "OUT_OF_STOCK":
        return "out_of_stock";
      default:
        return "unknown";
    }
  }

  private emptyResult(options: SearchOptions): SearchResult {
    return {
      products: [],
      totalResults: 0,
      page: options.page || 1,
      pageSize: options.pageSize || 12,
      hasMore: false,
      provider: this.id,
    };
  }
}
