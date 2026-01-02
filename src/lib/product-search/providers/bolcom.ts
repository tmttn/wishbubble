/**
 * Bol.com Product Search Provider
 *
 * Wraps the existing Bol.com API client to implement the ProductSearchProvider interface.
 */

import { ProductSearchProvider } from "./base";
import {
  SearchOptions,
  SearchResult,
  SearchProduct,
  ProviderInfo,
  ProviderStatus,
} from "../types";
import * as bolcom from "@/lib/bolcom";
import { logger } from "@/lib/logger";

export class BolcomProvider extends ProductSearchProvider {
  readonly id = "bolcom";
  readonly name = "Bol.com";
  readonly type = "realtime" as const;

  isConfigured(): boolean {
    return bolcom.isBolcomConfigured();
  }

  async getStatus(): Promise<ProviderStatus> {
    if (!this.isConfigured()) {
      return "unavailable";
    }

    try {
      // Quick health check - search for a common term
      await bolcom.searchProducts("test", { pageSize: 1 });
      return "available";
    } catch (error) {
      logger.warn("Bol.com provider health check failed", { error });
      return "error";
    }
  }

  async getInfo(): Promise<ProviderInfo> {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      status: await this.getStatus(),
      supportsEanLookup: true,
      supportedCountries: ["NL", "BE"],
    };
  }

  async search(options: SearchOptions): Promise<SearchResult> {
    const sortMap: Record<
      string,
      "RELEVANCE" | "POPULARITY" | "PRICE_ASC" | "PRICE_DESC" | "RATING"
    > = {
      relevance: "RELEVANCE",
      price_asc: "PRICE_ASC",
      price_desc: "PRICE_DESC",
      rating: "RATING",
    };

    const result = await bolcom.searchProducts(options.query, {
      page: options.page,
      pageSize: options.pageSize,
      sort: sortMap[options.sort || "relevance"],
    });

    const products: SearchProduct[] = result.products.map((p) => ({
      id: p.ean,
      providerId: this.id,
      title: p.title,
      description: p.specsTag || p.description,
      price: p.offer?.price,
      currency: p.offer?.currency || "EUR",
      url: p.url,
      imageUrl: p.image?.url,
      ean: p.ean,
      rating: p.rating,
      originalPrice: p.offer?.strikethroughPrice,
      affiliateUrl: this.generateAffiliateLink(p.url),
    }));

    return {
      products,
      totalResults: result.totalResultSize,
      page: result.page,
      pageSize: result.pageSize,
      hasMore: result.page * result.pageSize < result.totalResultSize,
      provider: this.id,
    };
  }

  async getByEan(ean: string): Promise<SearchProduct | null> {
    const product = await bolcom.getProductByEan(ean);
    if (!product) return null;

    return {
      id: product.ean,
      providerId: this.id,
      title: product.title,
      description: product.specsTag || product.description,
      price: product.offer?.price,
      currency: product.offer?.currency || "EUR",
      url: product.url,
      imageUrl: product.image?.url,
      ean: product.ean,
      rating: product.rating,
      originalPrice: product.offer?.strikethroughPrice,
      affiliateUrl: this.generateAffiliateLink(product.url),
    };
  }

  generateAffiliateLink(productUrl: string, subId?: string): string {
    return bolcom.generateAffiliateLink(productUrl, subId);
  }

  matchesUrl(url: string): boolean {
    return bolcom.isBolcomUrl(url);
  }
}
