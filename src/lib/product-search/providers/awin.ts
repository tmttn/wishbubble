/**
 * Awin Feed Product Search Provider
 *
 * Searches products from imported Awin CSV feeds stored in the database.
 * Each feed (Coolblue, Dreamland, Fnac, etc.) gets its own provider instance.
 */

import { ProductSearchProvider } from "./base";
import {
  SearchOptions,
  SearchResult,
  SearchProduct,
  ProviderInfo,
  ProviderStatus,
} from "../types";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

interface AwinFeedProviderConfig {
  id: string; // e.g., "awin_coolblue"
  name: string; // e.g., "Coolblue"
  dbProviderId: string; // Database ProductProvider.id
  affiliateMerchantId?: string; // Awin merchant ID for affiliate links
  urlPattern?: RegExp; // Pattern to match URLs for this provider
  // Database-configured affiliate settings
  affiliateCode?: string | null;
  affiliateParam?: string | null;
}

export class AwinFeedProvider extends ProductSearchProvider {
  readonly type = "feed" as const;
  readonly id: string;
  readonly name: string;

  private dbProviderId: string;
  private affiliateMerchantId?: string;
  private urlPattern?: RegExp;
  private affiliateCode?: string | null;
  private affiliateParam?: string | null;

  constructor(config: AwinFeedProviderConfig) {
    super();
    this.id = config.id;
    this.name = config.name;
    this.dbProviderId = config.dbProviderId;
    this.affiliateMerchantId = config.affiliateMerchantId;
    this.urlPattern = config.urlPattern;
    this.affiliateCode = config.affiliateCode;
    this.affiliateParam = config.affiliateParam;
  }

  isConfigured(): boolean {
    // Feed providers are configured if they have products imported
    return true;
  }

  async getStatus(): Promise<ProviderStatus> {
    const provider = await prisma.productProvider.findUnique({
      where: { id: this.dbProviderId },
      select: { enabled: true, productCount: true },
    });

    if (!provider) return "unavailable";
    if (!provider.enabled) return "disabled";
    if (!provider.productCount || provider.productCount === 0)
      return "unavailable";
    return "available";
  }

  async getInfo(): Promise<ProviderInfo> {
    const provider = await prisma.productProvider.findUnique({
      where: { id: this.dbProviderId },
      select: { enabled: true, productCount: true, lastSynced: true },
    });

    return {
      id: this.id,
      name: this.name,
      type: this.type,
      status: await this.getStatus(),
      lastUpdated: provider?.lastSynced || undefined,
      productCount: provider?.productCount || 0,
      supportsEanLookup: true,
    };
  }

  async search(options: SearchOptions): Promise<SearchResult> {
    const { query, page = 1, pageSize = 12, sort, priceMin, priceMax } = options;

    // Build price filter if needed
    const priceFilter: Prisma.FeedProductWhereInput["price"] =
      priceMin !== undefined || priceMax !== undefined
        ? {
            ...(priceMin !== undefined && { gte: priceMin }),
            ...(priceMax !== undefined && { lte: priceMax }),
          }
        : undefined;

    // Build where clause
    const where: Prisma.FeedProductWhereInput = {
      providerId: this.dbProviderId,
      searchText: { contains: query.toLowerCase(), mode: "insensitive" },
      ...(priceFilter && { price: priceFilter }),
    };

    const [products, total] = await Promise.all([
      prisma.feedProduct.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: this.getSortOrder(sort),
      }),
      prisma.feedProduct.count({ where }),
    ]);

    const searchProducts: SearchProduct[] = products.map((p) => ({
      id: p.externalId,
      providerId: this.id,
      title: p.title,
      description: p.description || undefined,
      price: p.price ? Number(p.price) : undefined,
      currency: p.currency,
      url: p.url,
      imageUrl: p.imageUrl || undefined,
      ean: p.ean || undefined,
      brand: p.brand || undefined,
      category: p.category || undefined,
      originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
      availability: this.mapAvailability(p.availability),
      affiliateUrl: p.affiliateUrl || this.generateAffiliateLink(p.url),
    }));

    return {
      products: searchProducts,
      totalResults: total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
      provider: this.id,
    };
  }

  async getByEan(ean: string): Promise<SearchProduct | null> {
    const product = await prisma.feedProduct.findFirst({
      where: {
        providerId: this.dbProviderId,
        ean,
      },
    });

    if (!product) return null;

    return {
      id: product.externalId,
      providerId: this.id,
      title: product.title,
      description: product.description || undefined,
      price: product.price ? Number(product.price) : undefined,
      currency: product.currency,
      url: product.url,
      imageUrl: product.imageUrl || undefined,
      ean: product.ean || undefined,
      brand: product.brand || undefined,
      category: product.category || undefined,
      originalPrice: product.originalPrice
        ? Number(product.originalPrice)
        : undefined,
      availability: this.mapAvailability(product.availability),
      affiliateUrl:
        product.affiliateUrl || this.generateAffiliateLink(product.url),
    };
  }

  generateAffiliateLink(productUrl: string, subId?: string): string {
    // First try Awin deep link if configured
    if (this.affiliateMerchantId) {
      const publisherId = process.env.AWIN_PUBLISHER_ID;
      if (publisherId) {
        // Awin deep link format
        const params = new URLSearchParams({
          awinmid: this.affiliateMerchantId,
          awinaffid: publisherId,
          ued: productUrl,
        });

        if (subId) {
          params.set("clickref", subId);
        }

        return `https://www.awin1.com/cread.php?${params}`;
      }
    }

    // Fall back to database-configured affiliate code
    if (this.affiliateCode) {
      try {
        const urlObj = new URL(productUrl);

        if (this.affiliateParam) {
          // Check if the parameter already exists with the correct value
          const existingValue = urlObj.searchParams.get(this.affiliateParam);
          if (existingValue === this.affiliateCode) {
            return productUrl;
          }
          // Add/replace as a proper query parameter
          urlObj.searchParams.set(this.affiliateParam, this.affiliateCode);
          return urlObj.toString();
        } else {
          // Append as-is (for custom formats)
          const code = this.affiliateCode.replace(/^[?&]/, "");
          // Check if the URL already contains this exact code segment
          if (urlObj.search.includes(code)) {
            return productUrl;
          }
          const separator = urlObj.search ? "&" : "?";
          return `${urlObj.toString()}${separator}${code}`;
        }
      } catch {
        return productUrl;
      }
    }

    return productUrl;
  }

  matchesUrl(url: string): boolean {
    if (!this.urlPattern) return false;
    return this.urlPattern.test(url);
  }

  private getSortOrder(sort?: string) {
    switch (sort) {
      case "price_asc":
        return { price: "asc" as const };
      case "price_desc":
        return { price: "desc" as const };
      case "rating":
        // Feed products don't have ratings, fall back to title
        return { title: "asc" as const };
      default:
        // Relevance - for database search, we just use title order
        return { title: "asc" as const };
    }
  }

  private mapAvailability(
    availability: string
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
}

/**
 * Create an Awin feed provider from database configuration
 */
export async function createAwinProvider(
  providerId: string
): Promise<AwinFeedProvider | null> {
  const provider = await prisma.productProvider.findUnique({
    where: { providerId },
  });

  if (!provider || provider.type !== "FEED") {
    return null;
  }

  // Extract configuration from provider
  const urlPatternMap: Record<string, RegExp> = {
    awin_coolblue: /coolblue\.(nl|be|de)/i,
    awin_dreamland: /dreamland\.be/i,
    awin_fnac: /fnac\.(be|fr)/i,
    awin_mediamarkt: /mediamarkt\.(nl|be|de)/i,
    awin_wehkamp: /wehkamp\.nl/i,
    awin_zalando: /zalando\.(nl|be)/i,
  };

  const affiliateMerchantIds: Record<string, string> = {
    // These would be configured per merchant
    // Example: awin_coolblue: "12345"
  };

  // Build URL pattern from database config if available
  let urlPattern = urlPatternMap[provider.providerId];
  if (!urlPattern && provider.urlPatterns) {
    // Create regex from comma-separated patterns
    const patterns = provider.urlPatterns
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => p.replace(/\./g, "\\.")) // Escape dots
      .join("|");
    if (patterns) {
      urlPattern = new RegExp(patterns, "i");
    }
  }

  return new AwinFeedProvider({
    id: provider.providerId,
    name: provider.name,
    dbProviderId: provider.id,
    affiliateMerchantId: affiliateMerchantIds[provider.providerId],
    urlPattern,
    affiliateCode: provider.affiliateCode,
    affiliateParam: provider.affiliateParam,
  });
}

/**
 * Load all Awin feed providers from database and register them
 */
export async function loadAwinProviders(): Promise<AwinFeedProvider[]> {
  const feedProviders = await prisma.productProvider.findMany({
    where: {
      type: "FEED",
      enabled: true,
    },
  });

  const providers: AwinFeedProvider[] = [];

  for (const dbProvider of feedProviders) {
    const provider = await createAwinProvider(dbProvider.providerId);
    if (provider) {
      providers.push(provider);
    }
  }

  return providers;
}
